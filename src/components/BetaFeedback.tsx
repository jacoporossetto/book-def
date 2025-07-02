
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Bug, Lightbulb, Star, Send, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BetaFeedback = () => {
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [feature, setFeature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const feedbackTypes = [
    { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500' },
    { value: 'feature', label: 'Richiesta Feature', icon: Lightbulb, color: 'text-yellow-500' },
    { value: 'improvement', label: 'Miglioramento', icon: Star, color: 'text-blue-500' },
    { value: 'general', label: 'Feedback Generale', icon: MessageSquare, color: 'text-green-500' }
  ];

  const features = [
    'Scanner ISBN',
    'Sistema Raccomandazioni',
    'Libreria Personale',
    'Profilo Utente',
    'Statistiche',
    'Export Dati',
    'UI/UX Generale',
    'Performance',
    'Altro'
  ];

  const severityLevels = [
    { value: 'low', label: 'Bassa', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critica', color: 'bg-red-100 text-red-800' }
  ];

  const handleSubmit = async () => {
    if (!feedbackType || !feedbackText.trim()) {
      toast({
        title: "Campi obbligatori mancanti",
        description: "Seleziona il tipo di feedback e scrivi il tuo messaggio",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Simula invio feedback (in una vera app questo andrebbe a un endpoint)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const feedbackData = {
      type: feedbackType,
      text: feedbackText,
      severity,
      feature,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Salva in localStorage per simulare l'invio
    const existingFeedback = JSON.parse(localStorage.getItem('betaFeedback') || '[]');
    existingFeedback.push(feedbackData);
    localStorage.setItem('betaFeedback', JSON.stringify(existingFeedback));

    setIsSubmitting(false);
    
    // Reset form
    setFeedbackType('');
    setFeedbackText('');
    setSeverity('medium');
    setFeature('');

    toast({
      title: "Feedback inviato!",
      description: "Grazie per il tuo contributo al miglioramento dell'app",
    });
  };

  const selectedFeedbackType = feedbackTypes.find(type => type.value === feedbackType);

  return (
    <div className="space-y-6">
      {/* Beta Program Info */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-purple-100 dark:bg-purple-800 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Benvenuto nel Beta Program!</h3>
              <p className="text-muted-foreground mb-4">
                Stai testando BookScan AI in anteprima. Il tuo feedback è prezioso per migliorare l'esperienza di tutti gli utenti.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Versione Beta 1.0</Badge>
                <Badge variant="outline">Tester Privilegiato</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Form */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Invia Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Feedback Type */}
          <div>
            <Label>Tipo di feedback *</Label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Seleziona il tipo di feedback" />
              </SelectTrigger>
              <SelectContent>
                {feedbackTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className={`w-4 h-4 ${type.color}`} />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feature Selection */}
          <div>
            <Label>Funzionalità interessata</Label>
            <Select value={feature} onValueChange={setFeature}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Seleziona la funzionalità (opzionale)" />
              </SelectTrigger>
              <SelectContent>
                {features.map(feat => (
                  <SelectItem key={feat} value={feat}>{feat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity (only for bugs) */}
          {feedbackType === 'bug' && (
            <div>
              <Label>Gravità del problema</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <Badge className={level.color} variant="secondary">
                        {level.label}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Feedback Text */}
          <div>
            <Label>Il tuo feedback *</Label>
            <Textarea
              placeholder={
                feedbackType === 'bug' 
                  ? "Descrivi il problema in dettaglio: cosa hai fatto, cosa ti aspettavi e cosa è successo invece..."
                  : feedbackType === 'feature'
                  ? "Descrivi la nuova funzionalità che vorresti vedere nell'app..."
                  : feedbackType === 'improvement'
                  ? "Come pensi che questa funzionalità possa essere migliorata..."
                  : "Condividi la tua opinione generale sull'app..."
              }
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="mt-2 min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Più dettagli fornisci, più saremo in grado di aiutarti!
            </p>
          </div>

          {/* Preview */}
          {selectedFeedbackType && feedbackText && (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Anteprima del tuo feedback:</p>
              <div className="flex items-center gap-2 mb-2">
                <selectedFeedbackType.icon className={`w-4 h-4 ${selectedFeedbackType.color}`} />
                <Badge variant="outline">{selectedFeedbackType.label}</Badge>
                {feature && <Badge variant="secondary">{feature}</Badge>}
                {feedbackType === 'bug' && (
                  <Badge className={severityLevels.find(s => s.value === severity)?.color}>
                    {severityLevels.find(s => s.value === severity)?.label}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground italic">
                "{feedbackText.slice(0, 150)}{feedbackText.length > 150 ? '...' : ''}"
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !feedbackType || !feedbackText.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Invio in corso...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Invia Feedback
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Tips for Beta Testers */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Suggerimenti per Beta Tester
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">🐛 Per Bug Report:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Descrivi i passaggi per riprodurre il bug</li>
                <li>• Includi cosa ti aspettavi vs cosa è successo</li>
                <li>• Specifica browser e dispositivo usato</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">💡 Per Nuove Feature:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Spiega il problema che risolverebbe</li>
                <li>• Descrivi come la useresti</li>
                <li>• Suggerisci priorità e importanza</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BetaFeedback;
