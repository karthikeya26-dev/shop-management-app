from flask import Blueprint, request, jsonify
from models import db, User, Product, Sale, Expense, Report, Alert
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, date

bp = Blueprint('api', __name__)

@bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        access_token = create_access_token(identity=str(user.id))
        return jsonify(access_token=access_token, role=user.role)
    
    return jsonify({"msg": "Bad username or password"}), 401

@bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"msg": "Missing username or password"}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "Username already exists"}), 400
        
    new_user = User(username=username, role='admin') # defaulting to admin for dashboard access
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"msg": "User created successfully"}), 201


@bp.route('/products', methods=['GET', 'POST'])
@jwt_required()
def handle_products():
    current_user = int(get_jwt_identity())
    
    if request.method == 'GET':
        products = Product.query.filter_by(user_id=current_user).all()
        return jsonify([{"id": p.id, "name": p.name, "sku": p.sku, "price": p.price, "stock": p.stock_quantity} for p in products])
    
    if request.method == 'POST':
        data = request.get_json()
        new_product = Product(
            user_id=current_user,
            name=data['name'], 
            sku=data['sku'], 
            price=data['price'],
            stock_quantity=data.get('stock_quantity', 0),
            low_stock_threshold=data.get('low_stock_threshold', 5)
        )
        db.session.add(new_product)
        db.session.commit()
        return jsonify({"msg": "Product created", "id": new_product.id}), 201

@bp.route('/products/<int:product_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def handle_product_item(product_id):
    current_user = int(get_jwt_identity())
    product = Product.query.filter_by(id=product_id, user_id=current_user).first()
    if not product:
        return jsonify({"msg": "Product not found"}), 404
        
    if request.method == 'PUT':
        data = request.get_json()
        if 'add_stock' in data:
            product.stock_quantity += int(data['add_stock'])
        db.session.commit()
        return jsonify({"msg": "Product updated"}), 200
        
    if request.method == 'DELETE':
        try:
            Sale.query.filter_by(product_id=product_id, user_id=current_user).delete()
            db.session.delete(product)
            db.session.commit()
            return jsonify({"msg": "Product and associated sales removed"}), 200
        except Exception:
            db.session.rollback()
            return jsonify({"msg": "Failed to remove product"}), 500

@bp.route('/sales', methods=['GET', 'POST'])
@jwt_required()
def handle_sales():
    current_user = int(get_jwt_identity())
    
    if request.method == 'GET':
        sales = Sale.query.filter_by(user_id=current_user).all()
        return jsonify([{"id": s.id, "product_id": s.product_id, "quantity": s.quantity, "total": s.total_amount, "date": s.sale_date} for s in sales])
    
    if request.method == 'POST':
        data = request.get_json()
        product = Product.query.filter_by(id=data['product_id'], user_id=current_user).first()
        if not product or product.stock_quantity < data['quantity']:
            return jsonify({"msg": "Not enough stock or invalid product"}), 400
        
        # Deduct stock
        product.stock_quantity -= data['quantity']

        # Add Sale
        new_sale = Sale(
            user_id=current_user,
            product_id=product.id,
            quantity=data['quantity'],
            total_amount=product.price * data['quantity']
        )
        db.session.add(new_sale)

        # Check stock alert
        if product.stock_quantity <= product.low_stock_threshold:
            alert = Alert(
                user_id=current_user,
                message=f"Low stock for product: {product.name} (SKU: {product.sku}) - Only {product.stock_quantity} left!"
            )
            db.session.add(alert)

        db.session.commit()
        return jsonify({"msg": "Sale recorded", "id": new_sale.id}), 201

@bp.route('/expenses', methods=['GET', 'POST'])
@jwt_required()
def handle_expenses():
    current_user = int(get_jwt_identity())
    
    if request.method == 'GET':
        expenses = Expense.query.filter_by(user_id=current_user).all()
        return jsonify([{"id": e.id, "description": e.description, "amount": e.amount, "date": e.expense_date} for e in expenses])
    
    if request.method == 'POST':
        data = request.get_json()
        new_expense = Expense(
            user_id=current_user,
            description=data['description'],
            amount=data['amount']
        )
        db.session.add(new_expense)
        db.session.commit()
        return jsonify({"msg": "Expense recorded", "id": new_expense.id}), 201

@bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_summary():
    from sqlalchemy import func
    
    current_user = int(get_jwt_identity())
    today = date.today()
    
    sales = Sale.query.filter_by(user_id=current_user).all()
    expenses_total = db.session.query(func.sum(Expense.amount)).filter_by(user_id=current_user).scalar() or 0.0

    total_sales = 0.0
    daily_sales = 0.0
    monthly_sales = 0.0
    item_counts = {}

    for s in sales:
        total_sales += s.total_amount
        sd = s.sale_date.date()
        
        if sd == today:
            daily_sales += s.total_amount
            
        if sd.year == today.year and sd.month == today.month:
            monthly_sales += s.total_amount
            
        item_counts[s.product_id] = item_counts.get(s.product_id, 0) + s.quantity
        
    profit = total_sales - expenses_total
    alerts = Alert.query.filter_by(user_id=current_user, is_read=False).count()
    
    # Resolve top items scoped to user
    top_items = []
    if item_counts:
        sorted_items = sorted(item_counts.items(), key=lambda item: item[1], reverse=True)[:5]
        for pid, qty in sorted_items:
            p = Product.query.filter_by(id=pid, user_id=current_user).first()
            if p:
                top_items.append({"name": p.name, "qty": qty})
                
    return jsonify({
        "total_sales": total_sales,
        "daily_sales": daily_sales,
        "monthly_sales": monthly_sales,
        "total_expenses": expenses_total,
        "net_profit": profit,
        "unresolved_alerts": alerts,
        "top_items": top_items
    })

@bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    current_user = int(get_jwt_identity())
    alerts = Alert.query.filter_by(user_id=current_user).order_by(Alert.created_at.desc()).all()
    return jsonify([{"id": a.id, "message": a.message, "is_read": a.is_read, "date": a.created_at} for a in alerts])

@bp.route('/reset', methods=['DELETE'])
@jwt_required()
def reset_data():
    current_user = int(get_jwt_identity())
    try:
        Sale.query.filter_by(user_id=current_user).delete()
        Expense.query.filter_by(user_id=current_user).delete()
        Alert.query.filter_by(user_id=current_user).delete()
        db.session.commit()
        return jsonify({"msg": "Successfully wiped all Sales, Expenses, and Alerts for this shop."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error wiping data"}), 500
