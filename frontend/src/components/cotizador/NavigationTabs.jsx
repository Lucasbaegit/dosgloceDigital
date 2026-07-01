const NAV_ITEMS = [
  "Cotizar",
  "Modificar precios",
  "Ajustar Precios por Familia",
  "Maestros de Costos",
  "Entender un precio",
  "Ver impacto de cambios",
  "Historial y backups",
  "Exportar soporte Excel",
  "Configuración avanzada",
];

const TAB_KEYS = new Set(NAV_ITEMS);
const NAV_TEST_IDS = {
  "Cotizar": "tab-quote",
  "Modificar precios": "tab-admin-prices",
  "Ajustar Precios por Familia": "tab-family-price-adjust",
  "Maestros de Costos": "tab-maestros-costos",
  "Entender un precio": "tab-understand-price",
  "Ver impacto de cambios": "tab-variable-impact",
  "Historial y backups": "tab-history-backups",
  "Exportar soporte Excel": "tab-export-support-excel",
  "Configuración avanzada": "tab-advanced-config",
};

export default function NavigationTabs({ activeTab, setActiveTab }) {
  return (
    <nav>
      {NAV_ITEMS.map((item) => (
        <button
          key={item}
          type="button"
          data-testid={NAV_TEST_IDS[item]}
          className={activeTab === item ? "nav-item active" : "nav-item"}
          onClick={() => TAB_KEYS.has(item) && setActiveTab(item)}
        >
          {item}
        </button>
      ))}
    </nav>
  );
}
