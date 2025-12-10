import { User, Sun, Moon, Home, Map as MapIcon, Truck, Building2, Users, ClipboardList, LocateFixed, Menu } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/Button';
import { useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import NotificationBell from './NotificationBell';

type HeaderProps = {
  onToggleSidebar?: () => void;
};

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const pathMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/map": "Mapa",
    "/fleet": "Frota",
    "/garages": "Garagens",
    "/users": "Usuarios",
    "/drivers": "Motoristas",
    "/orders": "Ordens de Entrega",
    "/service-board": "Agenda O.S.",
    "/coverage": "Cobertura",
    "/my-orders": "Minhas Ordens",
  };
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    "/dashboard": Home,
    "/map": MapIcon,
    "/fleet": Truck,
    "/garages": Building2,
    "/users": Users,
    "/drivers": Users,
    "/orders": ClipboardList,
    "/service-board": ClipboardList,
    "/coverage": LocateFixed,
    "/my-orders": ClipboardList,
  };

  const currentTitle =
    pathMap[location.pathname] ||
    location.pathname.replace("/", "").replace("-", " ").trim() ||
    "Chariot";
  const CurrentIcon = iconMap[location.pathname] || Home;

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="Abrir menu"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </button>
        <CurrentIcon className="h-6 w-6 text-slate-900 dark:text-white" />
        <p className={styles.title}>{currentTitle}</p>
      </div>
      <div className={styles.actions}>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-slate-900 dark:text-white" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-900 dark:text-white" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <NotificationBell />
        <div className={styles.user}>
          <User className="w-6 h-6" />
          <span className={styles.username}>Renato</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
