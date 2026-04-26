import React, { useState, useEffect } from 'react';
import './index.css';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://127.0.0.1:5000/api' 
  : '/_/backend/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [stats, setStats] = useState({
    total_sales: 0,
    daily_sales: 0,
    monthly_sales: 0,
    total_expenses: 0,
    net_profit: 0,
    unresolved_alerts: 0,
    top_items: []
  });
  const [products, setProducts] = useState([]);
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Apply theme to body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const submitAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        if (authMode === 'register') {
           alert("Registration successful! You can now log in.");
           setAuthMode('login');
        } else {
           localStorage.setItem('token', data.access_token);
           setToken(data.access_token);
        }
      } else {
        alert(data.msg || "Authentication failed");
      }
    } catch (err) {
      console.error(err);
      alert("API not running on port 5000, or CORS issue.");
    }
    setLoading(false);
  };

  const fetchDashboard = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStats(data);
      else if (res.status === 401) {
        localStorage.clear();
        setToken(null);
      }
    } catch (e) { console.error(e); }
  };

  const fetchProducts = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setProducts(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchDashboard();
    fetchProducts();
  }, [token]);

  const addExpense = async () => {
    const desc = window.prompt("Enter expense description (e.g. Server Hosting):");
    if (!desc) return;
    const amountStr = window.prompt("Enter expense amount ($):");
    if (!amountStr || isNaN(amountStr)) {
        alert("Invalid amount");
        return;
    }
    
    try {
      const res = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ description: desc, amount: parseFloat(amountStr) })
      });
      if (res.ok) fetchDashboard();
      else alert("Failed to add expense.");
    } catch(e) {
      alert("Error reaching the backend.");
    }
  };

  const createProduct = async () => {
    const name = window.prompt("1. Enter new product name:");
    if (!name) return;
    const priceStr = window.prompt("2. Enter price per unit ($):");
    if (!priceStr) return;
    const stockStr = window.prompt("3. Enter starting STOCK:");
    if (!stockStr) return;
    
    try {
       const res = await fetch(`${API_URL}/products`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
         body: JSON.stringify({ 
           name: name, 
           sku: name.substring(0,3).toUpperCase() + "-" + Date.now(), 
           price: parseFloat(priceStr), 
           stock_quantity: parseInt(stockStr),
           low_stock_threshold: 5
         })
       });
       if(res.ok) fetchProducts();
       else alert("Failed to create product");
    } catch(e) {
        alert("Error creating product");
    }
  };

  const handleSale = async (pId, name) => {
    const qty = window.prompt(`How many units of "${name}" are you selling to the customer?:`);
    if (!qty || isNaN(qty)) return;

    try {
       const res = await fetch(`${API_URL}/sales`, {
         method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
           body: JSON.stringify({ product_id: parseInt(pId), quantity: parseInt(qty) }) 
       });
       const data = await res.json();
       if(res.ok) {
         fetchDashboard();
         fetchProducts();
       } else {
         alert("Sale Failed (Stock might be too low!): " + (data.msg || "Error"));
       }
    } catch(e) {
        alert("Error making manual sale");
    }
  };

  const handleRestock = async (pId, name) => {
    const qty = window.prompt(`How many new units of "${name}" did you receive from the supplier?:`);
    if (!qty || isNaN(qty) || parseInt(qty) <= 0) return;

    try {
       const res = await fetch(`${API_URL}/products/${pId}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
         body: JSON.stringify({ add_stock: parseInt(qty) }) 
       });
       if(res.ok) {
         fetchDashboard();
         fetchProducts();
       } else {
         alert("Restock Failed.");
       }
    } catch(e) {
        alert("Error making restock");
    }
  };

  const handleDeleteItem = async (pId, name) => {
    if (!window.confirm(`⚠️ DANGER: Are you sure you want to permanently delete "${name}" from the inventory?\n\nThis will also remove all historical sales matching this product from your aggregate records!`)) return;

    try {
       const res = await fetch(`${API_URL}/products/${pId}`, {
         method: 'DELETE',
         headers: { 'Authorization': `Bearer ${token}` }
       });
       if(res.ok) {
         fetchDashboard();
         fetchProducts();
       } else {
         alert("Failed to delete product.");
       }
    } catch(e) {
        alert("Error securely deleting product from backend database");
    }
  };

  const resetData = async () => {
    if (!window.confirm("⚠️ Are you absolutely sure you want to WIPE all Sales, Expenses, and Alerts out of the Database? Your product inventory will remain safe.")) return;
    try {
      const res = await fetch(`${API_URL}/reset`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Database successfully wiped and refreshed.");
        fetchDashboard();
      } else {
        alert("Failed to wipe data. Admin privileges required.");
      }
    } catch(e) {
      alert("Error reaching the backend.");
    }
  };

  if (!token) {
    return (
      <div className="dashboard-container" style={{maxWidth: '400px', margin: '10vh auto', textAlign: 'center'}}>
        <h1>Cloud Shop Manager</h1>
        <p style={{margin: '1rem 0 2rem 0', color: 'var(--text-muted)'}}>Secure Portal Authentication</p>
        
        <form onSubmit={submitAuth} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            style={{padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)'}}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)'}}
            required 
          />
          <button type="submit" className="btn" disabled={loading} style={{marginTop: '1rem', padding: '1rem'}}>
            {loading ? "Processing..." : (authMode === 'login' ? 'Secure Login' : 'Create Account')}
          </button>
        </form>

        <p style={{marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem'}}>
          {authMode === 'login' ? "New around here?" : "Already managing a shop?"}
          <button 
             onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
             style={{background: 'none', border: 'none', color: 'var(--accent)', marginLeft: '0.5rem', cursor: 'pointer', fontWeight: 'bold'}}>
            {authMode === 'login' ? 'Sign up here' : 'Log in here'}
          </button>
        </p>

        <div style={{marginTop: '2rem'}}>
           <select className="theme-selector" value={theme} onChange={(e) => setTheme(e.target.value)}>
             <option value="dark">🌙 Dark Theme</option>
             <option value="light">☀️ Light Theme</option>
             <option value="ocean">🌊 Ocean Theme</option>
             <option value="sunset">🌇 Sunset Theme</option>
           </select>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header>
        <h1>Cloud Shop Manager</h1>
        <div className="action-bar">
          <select className="theme-selector" value={theme} onChange={(e) => setTheme(e.target.value)}>
             <option value="dark">Dark Theme</option>
             <option value="light">Light Theme</option>
             <option value="ocean">Ocean</option>
             <option value="sunset">Sunset</option>
          </select>
          <button className="btn" style={{background: '#f59e0b', color: '#111827'}} onClick={resetData}>Reset App Data</button>
          <button className="btn" style={{background: 'var(--btn-secondary-bg)', color: 'var(--btn-secondary-text)'}} onClick={createProduct}>+ Add Stock</button>
          <button className="btn btn-danger" onClick={addExpense}>Add Expense</button>
          <button className="btn" style={{background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)'}} onClick={()=>{localStorage.clear(); setToken(null)}}>Log Out</button>
        </div>
      </header>

      <main>
        {/* Expanded 6-Card Analytics Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-title">Daily Sales 🚀</div>
            <div className="stat-value val-green">${stats.daily_sales ? stats.daily_sales.toLocaleString() : 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Monthly Sales 🗓️</div>
            <div className="stat-value val-blue">${stats.monthly_sales ? stats.monthly_sales.toLocaleString() : 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Lifetime Sales</div>
            <div className="stat-value" style={{color: 'var(--text-main)'}}>${stats.total_sales ? stats.total_sales.toLocaleString() : 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Lifetime Expenses</div>
            <div className="stat-value val-red">${stats.total_expenses ? stats.total_expenses.toLocaleString() : 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Net Profit 💰</div>
            <div className="stat-value val-blue">${stats.net_profit ? stats.net_profit.toLocaleString() : 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Stock Alerts ⚠️</div>
            <div className="stat-value val-red" style={{color: stats.unresolved_alerts > 0 ? 'var(--danger)' : 'var(--text-muted)'}}>
              {stats.unresolved_alerts || 0}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Left side: Live Inventory Table */}
            <div style={{flex: '1 1 500px'}}>
                <h2 className="section-title">Live Inventory Manager</h2>
                {products.length === 0 ? (
                <p style={{color: 'var(--text-muted)'}}>No products configured. Click <strong>+ Add Stock</strong> above to register an item.</p>
                ) : (
                <div style={{overflowX: 'auto'}}>
                <table className="inventory-table">
                    <thead>
                    <tr>
                        <th>Item</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {products.map(p => (
                        <tr key={p.id}>
                        <td style={{fontWeight: '600'}}>{p.name} <span style={{fontSize:'0.7rem', color:'var(--text-muted)', display:'block'}}>{p.sku}</span></td>
                        <td>${p.price.toFixed(2)}</td>
                        <td>
                            <span style={{color: p.stock <= p.low_stock_threshold ? 'var(--danger)' : 'var(--success)', fontWeight: 'bold'}}>
                            {p.stock} units
                            </span>
                        </td>
                        <td style={{display: 'flex', gap: '0.4rem', flexWrap: 'wrap'}}>
                            <button className="btn" style={{padding: '0.4rem 0.6rem', fontSize: '0.8rem'}} onClick={() => handleSale(p.id, p.name)}>
                              Sell
                            </button>
                            <button className="btn" style={{background: 'var(--btn-secondary-bg)', color: 'var(--btn-secondary-text)', padding: '0.4rem 0.6rem', fontSize: '0.8rem'}} onClick={() => handleRestock(p.id, p.name)}>
                              Restock
                            </button>
                            <button className="btn" style={{background: 'transparent', border:'1px solid var(--danger)', color: 'var(--danger)', padding: '0.4rem 0.6rem', fontSize: '0.8rem'}} onClick={() => handleDeleteItem(p.id, p.name)}>
                              Remove
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
                )}
            </div>

            {/* Right side: Top Selling Analytics */}
            <div style={{width: '300px', flexGrow: 1, background: 'var(--input-bg)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)'}}>
                <h2 className="section-title" style={{fontSize: '1rem', borderBottom: 'none'}}>🔥 Top Sellers</h2>
                {stats.top_items && stats.top_items.length > 0 ? (
                    <ul style={{listStyle: 'none', padding: 0}}>
                        {stats.top_items.map((item, i) => (
                            <li key={i} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom:'0.5rem', borderBottom:'1px solid var(--border-color)'}}>
                                <span>{i+1}. {item.name}</span>
                                <span style={{color: 'var(--accent)', fontWeight: 'bold'}}>{item.qty} sold</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>No sales data recorded yet.</p>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
