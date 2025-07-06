import { Button } from "@/components/ui/button";
import { Library, Map, LayoutGrid } from "lucide-react"; // Cambiato BookOpen con LayoutGrid per assomigliare di più all'icona

interface BottomNavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNavBar = ({ activeTab, setActiveTab }: BottomNavBarProps) => {
  const tabs = [
    { name: 'scanner', label: 'Scanner', icon: LayoutGrid }, // Icona e Label aggiornati
    { name: 'library', label: 'Library', icon: Library }, // Label aggiornata
    { name: 'map', label: 'Map', icon: Map },             // Label aggiornata
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.name}
            variant="ghost"
            className={`inline-flex flex-col items-center justify-center font-medium h-full rounded-none text-sm transition-colors duration-200 ${
              activeTab === tab.name ? 'text-[#147979]' : 'text-gray-400' // Stile aggiornato per la tab attiva e inattiva
            }`}
            onClick={() => setActiveTab(tab.name)}
          >
            <tab.icon className="h-6 w-6 mb-1" />
            {tab.label}
          </Button>
        ))}
      </div>
    </div>
  );
};