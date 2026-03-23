// src/hooks/useGenNewsletter.ts
import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export interface NewsletterTemplate {
  id: string;
  workspace_id: string;
  name: string;
  subject: string;
  h1: string;
  content: string;
  cta_text: string;
  cta_url: string;
  logo_url: string;
  primary_color: string;
  footer_text: string;
  header_image_url?: string;
  html_export?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useGenNewsletterGenerate() {
  const { currentWorkspace } = useWorkspace();
  return useMutation({
    mutationFn: async (params: {
      subject?: string; context?: string; tone?: string; language?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('gen-newsletter-generate', {
        body: { workspace_id: currentWorkspace!.id, ...params }
      });
      if (error) throw error;
      return data as { subject: string; h1: string; content_html: string; cta_text: string };
    }
  });
}

export function useGenNewsletterSubject() {
  const { currentWorkspace } = useWorkspace();
  return useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase.functions.invoke('gen-newsletter-generate-subject', {
        body: { workspace_id: currentWorkspace!.id, content }
      });
      if (error) throw error;
      return data as { subjects: string[] };
    }
  });
}

export function useGenNewsletterImage() {
  const { currentWorkspace } = useWorkspace();
  return useMutation({
    mutationFn: async (params: { content: string; subject?: string }) => {
      const { data, error } = await supabase.functions.invoke('gen-newsletter-generate-image', {
        body: { workspace_id: currentWorkspace!.id, ...params }
      });
      if (error) throw error;
      return data as { image_url: string };
    }
  });
}

export function useNewsletterTemplates() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['newsletter-templates', currentWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('newsletter_templates')
        .select('*')
        .eq('workspace_id', currentWorkspace!.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as NewsletterTemplate[];
    },
    enabled: !!currentWorkspace?.id
  });

  const saveTemplate = useMutation({
    mutationFn: async (template: Partial<NewsletterTemplate>) => {
      const { data, error } = await (supabase as any)
        .from('newsletter_templates')
        .upsert({ ...template, workspace_id: currentWorkspace!.id, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data as NewsletterTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-templates', currentWorkspace?.id] });
    }
  });

  return { ...query, saveTemplate };
}

export function useNewsletterPreview(fields: {
  subject: string; h1: string; content: string; cta_text: string; cta_url: string;
  logo_url: string; primary_color: string; footer_text: string; header_image_url?: string
}) {
  const [previewHtml, setPreviewHtml] = useState('');

  const renderPreview = useCallback(() => {
    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin: 0; padding: 20px; background: #f5f5f5; font-family: Arial, sans-serif; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  .header-img { width: 100%; height: 200px; object-fit: cover; }
  .body { padding: 32px; }
  h1 { color: ${fields.primary_color}; margin: 0 0 16px; font-size: 24px; }
  .content { color: #333; line-height: 1.6; }
  .cta { display: inline-block; margin: 24px 0; padding: 12px 24px; background: ${fields.primary_color};
    color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
  .footer { padding: 16px 32px; background: #f9f9f9; text-align: center;
    font-size: 12px; color: #999; border-top: 1px solid #eee; }
  .logo { max-height: 40px; margin-bottom: 8px; }
</style></head>
<body><div class="container">
  ${fields.header_image_url ? `<img class="header-img" src="${fields.header_image_url}" alt="">` : ''}
  <div class="body">
    <h1>${fields.h1 || fields.subject || 'Tytuł newslettera'}</h1>
    <div class="content">${fields.content || '<p>Treść newslettera...</p>'}</div>
    ${fields.cta_text ? `<a href="${fields.cta_url || '#'}" class="cta">${fields.cta_text}</a>` : ''}
  </div>
  <div class="footer">
    ${fields.logo_url ? `<img class="logo" src="${fields.logo_url}" alt="Logo"><br>` : ''}
    ${fields.footer_text}
  </div>
</div></body></html>`;
    setPreviewHtml(html);
  }, [fields.subject, fields.h1, fields.content, fields.cta_text, fields.cta_url,
      fields.logo_url, fields.primary_color, fields.footer_text, fields.header_image_url]);

  useEffect(() => { renderPreview() }, [renderPreview]);

  return { previewHtml };
}
