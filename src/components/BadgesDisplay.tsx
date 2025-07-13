import { allBadges, BadgeInfo } from "@/lib/badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BadgesDisplayProps {
  unlockedBadgeIds: string[];
}

/**
 * Mostra una griglia di badge, distinguendo tra sbloccati e bloccati.
 */
export const BadgesDisplay: React.FC<BadgesDisplayProps> = ({ unlockedBadgeIds }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>I Tuoi Trofei</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
          {allBadges.map((badge) => {
            const isUnlocked = unlockedBadgeIds.includes(badge.id);
            const Icon = badge.icon;
            
            return (
              <TooltipProvider key={badge.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ${isUnlocked ? 'bg-green-100' : 'bg-gray-100 grayscale'}`}>
                      <Icon className={`w-8 h-8 ${isUnlocked ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={`mt-1 text-xs text-center font-semibold ${isUnlocked ? 'text-green-800' : 'text-gray-500'}`}>
                        {badge.title}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isUnlocked ? 'Sbloccato!' : 'Bloccato:'} {badge.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
