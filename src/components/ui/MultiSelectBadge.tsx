import { Badge } from "@/components/ui/badge";

// Definiamo le "props" che questo componente si aspetta di ricevere
interface MultiSelectBadgeProps {
  // La lista di tutte le opzioni possibili (es. tutti i generi)
  options: readonly string[];
  // La lista delle opzioni attualmente selezionate
  selectedOptions: string[];
  // Una funzione per comunicare al componente genitore che la selezione è cambiata
  onSelectionChange: (newSelection: string[]) => void;
}

export const MultiSelectBadge = ({ options, selectedOptions, onSelectionChange }: MultiSelectBadgeProps) => {
  
  // Questa funzione gestisce il click su un badge
  const handleToggle = (option: string) => {
    // Creiamo una nuova copia dell'array delle selezioni per non modificare lo stato direttamente
    const newSelection = [...selectedOptions];
    const optionIndex = newSelection.indexOf(option);

    if (optionIndex > -1) {
      // Se l'opzione è già selezionata, la rimuoviamo dall'array
      newSelection.splice(optionIndex, 1);
    } else {
      // Altrimenti, se non è selezionata, la aggiungiamo all'array
      newSelection.push(option);
    }
    // Comunichiamo la nuova selezione al componente genitore (EditProfilePage)
    onSelectionChange(newSelection);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Badge
          key={option}
          // Cambiamo l'aspetto del badge se è selezionato o meno
          variant={selectedOptions.includes(option) ? "default" : "outline"}
          className="cursor-pointer text-sm py-1 px-3 transition-all hover:scale-105 active:scale-95"
          onClick={() => handleToggle(option)}
        >
          {option}
        </Badge>
      ))}
    </div>
  );
};