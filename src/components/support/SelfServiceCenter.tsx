import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useKnowledgeBase } from "@/hooks/useTicketEnhanced";
import { 
  Search, 
  HelpCircle, 
  BookOpen, 
  CreditCard, 
  Shield, 
  BarChart3,
  ChevronRight,
  Sparkles,
  MessageSquarePlus
} from "lucide-react";

interface SelfServiceCenterProps {
  onCreateTicket: () => void;
}

const CATEGORY_CONFIG = {
  technical: { icon: HelpCircle, label: 'Technique', color: 'bg-blue-500' },
  billing: { icon: CreditCard, label: 'Facturation', color: 'bg-green-500' },
  score_dispute: { icon: BarChart3, label: 'Score & Certificat', color: 'bg-purple-500' },
  identity: { icon: Shield, label: 'Identité & KYC', color: 'bg-orange-500' },
  general: { icon: BookOpen, label: 'Général', color: 'bg-gray-500' }
};

const QUICK_ACTIONS = [
  {
    icon: BarChart3,
    title: "Mon score n'est pas à jour",
    solution: "Les mises à jour du score peuvent prendre jusqu'à 24h. Vérifiez que toutes vos preuves sont validées dans la section 'Mes Preuves'.",
    category: "score_dispute"
  },
  {
    icon: Shield,
    title: "Problème avec mon KYC",
    solution: "Assurez-vous que vos documents sont lisibles, non expirés, et que votre selfie est clair. Vous pouvez resoumettre dans la section 'Mon Profil'.",
    category: "identity"
  },
  {
    icon: CreditCard,
    title: "Paiement refusé",
    solution: "Vérifiez votre solde Mobile Money et réessayez après 5 minutes. Si le problème persiste, contactez votre opérateur.",
    category: "billing"
  }
];

export function SelfServiceCenter({ onCreateTicket }: SelfServiceCenterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: articles, isLoading } = useKnowledgeBase(selectedCategory || undefined);

  const filteredArticles = (articles || []).filter(article => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(query) ||
      article.content.toLowerCase().includes(query) ||
      article.keywords.some(kw => kw.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Centre de résolution automatique</span>
        </div>
        <h2 className="text-2xl font-bold">Comment pouvons-nous vous aider?</h2>
        <p className="text-muted-foreground">
          Trouvez des solutions instantanées ou créez un ticket de support
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Décrivez votre problème..."
          className="pl-10 h-12 text-lg"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {QUICK_ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => setSelectedCategory(action.category)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {action.solution}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap justify-center">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Tous
        </Button>
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(key)}
            >
              <Icon className="w-4 h-4 mr-1" />
              {config.label}
            </Button>
          );
        })}
      </div>

      {/* Knowledge Base Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Articles d'aide
          </CardTitle>
          <CardDescription>
            {filteredArticles.length} article(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse h-16 bg-muted rounded" />
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                Aucun article ne correspond à votre recherche.
              </p>
              <Button onClick={onCreateTicket}>
                <MessageSquarePlus className="w-4 h-4 mr-2" />
                Créer un ticket de support
              </Button>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {filteredArticles.map((article) => {
                const categoryConfig = CATEGORY_CONFIG[article.category as keyof typeof CATEGORY_CONFIG] 
                  || CATEGORY_CONFIG.general;
                
                return (
                  <AccordionItem 
                    key={article.id} 
                    value={article.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <Badge variant="secondary" className="text-xs">
                          {categoryConfig.label}
                        </Badge>
                        <span className="font-medium">{article.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="prose dark:prose-invert max-w-none text-sm">
                      <p className="whitespace-pre-wrap">{article.content}</p>
                      {article.keywords.length > 0 && (
                        <div className="flex gap-1 mt-3 flex-wrap">
                          {article.keywords.map(kw => (
                            <Badge key={kw} variant="outline" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">Vous n'avez pas trouvé votre réponse?</h3>
            <p className="text-sm text-muted-foreground">
              Notre équipe de support est là pour vous aider
            </p>
          </div>
          <Button onClick={onCreateTicket} size="lg">
            <MessageSquarePlus className="w-5 h-5 mr-2" />
            Créer un ticket
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
