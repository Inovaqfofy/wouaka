import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateTicket, TICKET_CATEGORY_CONFIG, TicketCategory } from "@/hooks/useSupportTickets";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  subject: z.string().min(5, "Sujet trop court (min 5 caractères)").max(200),
  description: z.string().min(20, "Description trop courte (min 20 caractères)").max(2000),
  category: z.enum(["technical", "billing", "score_dispute", "identity", "general"]),
});

type FormData = z.infer<typeof formSchema>;

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relatedCertificateId?: string;
  relatedKycId?: string;
}

export function CreateTicketDialog({
  open,
  onOpenChange,
  relatedCertificateId,
  relatedKycId,
}: CreateTicketDialogProps) {
  const createTicket = useCreateTicket();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      description: "",
      category: "general",
    },
  });

  const onSubmit = async (data: FormData) => {
    await createTicket.mutateAsync({
      subject: data.subject,
      description: data.description,
      category: data.category,
      related_certificate_id: relatedCertificateId,
      related_kyc_id: relatedKycId,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer un ticket de support</DialogTitle>
          <DialogDescription>
            Décrivez votre problème ou question. Notre équipe vous répondra rapidement.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(TICKET_CATEGORY_CONFIG) as TicketCategory[]).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {TICKET_CATEGORY_CONFIG[cat].icon} {TICKET_CATEGORY_CONFIG[cat].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sujet</FormLabel>
                  <FormControl>
                    <Input placeholder="Résumez votre demande..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez en détail votre problème ou question..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createTicket.isPending}>
                {createTicket.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Envoyer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
