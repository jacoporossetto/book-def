import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/firebase";
import { signOut } from "firebase/auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { LogOut, MoreVertical, User, BarChart3, FileText, MessageSquare } from "lucide-react";

// Il Header ora deve sapere come cambiare la scheda attiva nel Dashboard
interface HeaderProps {
  setActiveTab: (tab: string) => void;
}

export const Header = ({ setActiveTab }: HeaderProps) => {
    const { user, userProfile } = useAuth();

    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
            <div className="container mx-auto p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-lg font-bold truncate">
                        BookSnap
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Ciao, {userProfile?.displayName || user?.email}!
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
                        <LogOut className="h-5 w-5" />
                    </Button>
                    
                    {/* --- IL NUOVO MENU A TENDINA --- */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Altre opzioni">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setActiveTab('profile')}>
                                <User className="mr-2 h-4 w-4" />
                                <span>Profilo</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setActiveTab('stats')}>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                <span>Statistiche</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => setActiveTab('export')}>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Esporta Dati</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}