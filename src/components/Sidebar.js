import { FaCloudUploadAlt, FaChartBar, FaBalanceScale, FaHome, FaLock, FaRocket, FaSun, FaMoon, FaTimes } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ currentView, setCurrentView, hasData, toggleTheme, theme, isOpen, onClose }) => {
    const menuItems = [
        { id: 'upload', label: 'Resume Upload', icon: <FaCloudUploadAlt /> },
        { id: 'analysis', label: 'AI Analysis', icon: <FaChartBar />, requireData: true },
        { id: 'matching', label: 'JD Matching', icon: <FaBalanceScale />, requireData: true },
        { id: 'dashboard', label: 'Dashboard', icon: <FaHome />, requireData: true }
    ];

    return (
        <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header">
                <div className="logo">
                    <span className="logo-icon"><FaRocket /></span>
                    <span className="logo-text">AI Parser</span>
                </div>
                <button className="sidebar-close-btn" onClick={onClose}>
                    <FaTimes />
                </button>
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
                        {item.requireData && !hasData && <span className="lock-icon"><FaLock /></span>}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button onClick={toggleTheme} className="sidebar-theme-toggle">
                    {theme === 'dark' ? <><FaSun /> Light Mode</> : <><FaMoon /> Dark Mode</>}
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
