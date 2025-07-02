import { Button } from "@/components/ui/button";
import { BookOpen, Library, Map } from "lucide-react";

interface BottomNavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNavBar = ({ activeTab, setActiveTab }: BottomNavBarProps) => {
  const tabs = [
    { name: 'scanner', label: 'Scanner', icon: BookOpen },
    { name: 'library', label: 'Libreria', icon: Library },
    { name: 'map', label: 'Mappa', icon: Map },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.name}
            variant="ghost"
            className={`inline-flex flex-col items-center justify-center font-medium h-full rounded-none text-sm transition-colors duration-200 ${
              activeTab === tab.name ? 'text-primary bg-primary/10' : 'text-muted-foreground'
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