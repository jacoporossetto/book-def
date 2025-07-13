import { Badge } from "@/components/ui/badge";

interface MultiSelectBadgeProps {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

/**
 * Un componente che mostra una lista di opzioni come badge cliccabili,
 * permettendo la selezione multipla.
 */
export const MultiSelectBadge: React.FC<MultiSelectBadgeProps> = ({ options, selected, onChange }) => {
  const handleToggle = (option: string) => {
    // Se l'opzione è già selezionata, la rimuoviamo. Altrimenti, la aggiungiamo.
    const newSelected = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Badge
          key={option}
          variant={selected.includes(option) ? "default" : "secondary"}
          onClick={() => handleToggle(option)}
          className="cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 text-base px-4 py-2"
          style={selected.includes(option) ? { backgroundColor: '#147979' } : {}}
        >
          {option}
        </Badge>
      ))}
    </div>
  );
};