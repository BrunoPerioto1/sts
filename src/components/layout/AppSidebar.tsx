import { BarChart3, Target, Building2, User, LogOut, ChevronLeft } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, path: "/dashboard" },
  { id: "apostas", label: "Apostas", icon: Target, path: "/nova-aposta" },
  { id: "casas", label: "Casas de Apostas", icon: Building2, path: "/casas" },
  { id: "perfil", label: "Perfil", icon: User, path: "/perfil" },
];

// Interface para as props do AppSidebar
interface AppSidebarProps {
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  onNavigate?: () => void;
}

export function AppSidebar({ collapsed = false, setCollapsed = () => {}, onNavigate }: AppSidebarProps) {
  // Usando estado interno quando não receber props
  const [internalCollapsed, setInternalCollapsed] = useState(collapsed);
  const location = useLocation();
  
  // Função para controlar o colapso do sidebar
  const toggleCollapse = () => {
    const newState = !internalCollapsed;
    setInternalCollapsed(newState);
    setCollapsed(newState); // Comunica o estado para o pai, se fornecido
  };
  
  // Sincroniza o estado interno com props
  useEffect(() => {
    setInternalCollapsed(collapsed);
  }, [collapsed]);
  
  // Importar CSS uma vez ao montar o componente
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500&display=swap');
      
      :root {
        --sidebar-bg: #1a237e;
        --sidebar-hover: #283593;
        --sidebar-active: #3949ab;
        --sidebar-text: #ffffff;
        --sidebar-icon: #c5cae9;
        --sidebar-button: #448aff;
        --container-shadow: rgba(0, 0, 0, 0.3) 0px 5px 15px;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Determinar se está em modo mobile (quando onNavigate existe, está no drawer)
  const isInDrawer = !!onNavigate;
  
  return (
    <div 
      className={`sidebarContainer ${internalCollapsed ? 'shrink' : ''}`}
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        boxShadow: isInDrawer ? 'none' : 'var(--container-shadow)',
        borderRadius: isInDrawer ? '0' : '0 10px 10px 0',
        padding: '16px',
        transition: 'width 0.3s',
        position: isInDrawer ? 'relative' : 'fixed',
        left: isInDrawer ? 'auto' : 0,
        top: isInDrawer ? 'auto' : 0,
        width: isInDrawer ? '100%' : (internalCollapsed ? '92px' : '240px'),
        height: isInDrawer ? '100%' : '100vh',
        display: 'flex',
        flexDirection: 'column',
        margin: '0',
        fontFamily: "'Poppins', sans-serif",
        color: 'var(--sidebar-text)',
        zIndex: isInDrawer ? 'auto' : 50
      }}
    >
      {/* Toggle sidebar button - apenas em desktop */}
      {!isInDrawer && (
        <button 
          className="sidebarViewButton"
          onClick={toggleCollapse}
          style={{
            position: 'absolute',
            width: '24px',
            height: '24px',
            right: '-12px',
            top: '32px',
            border: 'none',
            borderRadius: '50%',
            backgroundColor: 'var(--sidebar-button)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--container-shadow)',
            transition: '0.3s'
          }}
        >
          <ChevronLeft 
            style={{
              width: '16px',
              transform: internalCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }}
          />
        </button>
      )}
      
     <div className="app-title" style={{ padding: '4px 0' }}>
  {!internalCollapsed && (
    <h2 style={{ color: 'var(--sidebar-text)', margin: 0 }}>SportsBet Manager</h2>
  )}
</div>

<div 
  className="sidebarWrapper"
  style={{
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    marginTop: '8px'
  }}
>
        {/* Theme toggle */}
        <div 
          className="sidebarThemeContainer"
          style={{
            padding: '4px',
            borderRadius: '4px',
            marginBottom: '16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '12px'
          }}
        >
         
        </div>
        
        {/* Menu items */}
        <ul 
          className="sidebarList"
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            flexGrow: 1
          }}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li 
                key={item.id} 
                className="sidebarListItem"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  backgroundColor: isActive ? 'var(--sidebar-active)' : 'transparent'
                }}
              >
                <NavLink
                  to={item.path}
                  end
                  onClick={onNavigate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    width: '100%',
                    textDecoration: 'none',
                    color: 'var(--sidebar-text)'
                  }}
                >
                  <Icon 
                    className="sidebarListIcon"
                    style={{
                      width: '20px',
                      height: '20px',
                      marginRight: internalCollapsed ? '0' : '12px',
                      color: 'var(--sidebar-icon)'
                    }}
                  />
                  {!internalCollapsed && (
                    <span className="sidebarListItemText" style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.label}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
        
        {/* Profile section */}
        <div 
          className="sidebarProfileSection"
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 'auto',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '8px 10px',
            borderRadius: '28px',
            cursor: 'pointer',
            transition: 'background 0.3s',
            color: 'var(--sidebar-text)'
          }}
          onClick={() => {
            if (onNavigate) onNavigate();
            window.location.href = "/logout";
          }}
        >
          <div 
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: internalCollapsed ? '0' : '8px'
            }}
          >
            <LogOut size={20} color="#fff" />
          </div>
          {!internalCollapsed && (
            <span style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Sair
            </span>
          )}
        </div>
      </div>
    </div>
  );
}