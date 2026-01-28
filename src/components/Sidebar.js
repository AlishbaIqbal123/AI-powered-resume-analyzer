import React from 'react';
import './Sidebar.css';

const Sidebar = ({ currentView, setCurrentView, hasData, toggleTheme, theme }) => {
    const menuItems = [
        { id: 'upload', label: 'Resume Upload', icon: '📁' },
        { id: 'analysis', label: 'AI Analysis', icon: '📊', requireData: true },
        { id: 'matching', label: 'JD Matching', icon: '⚖️', requireData: true },
        { id: 'dashboard', label: 'Dashboard', icon: '🏠', requireData: true },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <span className="logo-icon">🚀</span>
                    <span className="logo-text">AI Parser</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${currentView === item.id ? 'active' : ''} ${item.requireData && !hasData ? 'disabled' : ''}`}
                        onClick={() => (!item.requireData || hasData) && setCurrentView(item.id)}
                        disabled={item.requireData && !hasData}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                        {item.requireData && !hasData && <span className="lock-icon">🔒</span>}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button onClick={toggleTheme} className="sidebar-theme-toggle">
                    {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
                <div className="user-status">
                    <div className={`status-indicator ${hasData ? 'online' : 'offline'}`}></div>
                    <span className="status-text">{hasData ? 'Resume Loaded' : 'No Data'}</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
