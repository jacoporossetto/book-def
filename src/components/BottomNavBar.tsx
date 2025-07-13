import { Button } from "@/components/ui/button";
import { Library, Map, LayoutGrid, User } from "lucide-react"; // Aggiunto l'icona User

interface BottomNavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNavBar = ({ activeTab, setActiveTab }: BottomNavBarProps) => {
  const tabs = [
    { name: 'scanner', label: 'Scanner', icon: LayoutGrid },
    { name: 'library', label: 'Libreria', icon: Library },
    { name: 'map', label: 'Mappa', icon: Map },
    { name: 'profile', label: 'Profilo', icon: User }, // Nuova tab per il profilo
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t z-30">
      {/* Aggiornato a 4 colonne per fare spazio alla nuova icona */}
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.name}
            variant="ghost"
            className={`inline-flex flex-col items-center justify-center font-medium h-full rounded-none text-sm transition-colors duration-200 ${
              activeTab === tab.name ? 'text-[#147979]' : 'text-gray-400'
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