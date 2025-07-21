import { GoogleGenAI } from "@google/genai";
import type { Defect, ChecklistItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function generateInspectionReport(defects: Defect[], checklist: ChecklistItem[]): Promise<string> {
  if (!process.env.API_KEY) {
    console.error("API key is missing.");
    return "Erreur: La clé API Gemini n'est pas configurée. Veuillez vérifier les variables d'environnement.";
  }

  const formattedDefects = defects.length > 0 
    ? defects.map(d => `- Emplacement: ${d.side}, Titre: ${d.title}, Description: ${d.description}`).join('\n')
    : "Aucun défaut externe identifié.";

  const formattedChecklist = checklist.map(item => `- ${item.label}: ${item.checked ? 'Vérifié' : 'Non vérifié'}`).join('\n');

  const prompt = `
    Tu es un expert en maintenance de véhicules d'urgence pour les sapeurs-pompiers. 
    En te basant sur la liste suivante de défauts constatés et l'état de la checklist pour un camion de pompiers, génère un rapport d'inspection concis, structuré et professionnel en format Markdown.

    Le rapport doit inclure :
    1.  Un titre clair : "Rapport d'Inspection du Véhicule".
    2.  Une section "Défauts Externes Constatés" qui liste les problèmes identifiés. Si aucun défaut, mentionne-le.
    3.  Une section "Points de Contrôle (Checklist)" qui résume l'état de la checklist.
    4.  Une section "Synthèse et Recommandation" qui donne une conclusion sur l'état général du véhicule et une recommandation claire : "Apte au service" ou "Nécessite une maintenance avant mise en service".

    Voici les données de l'inspection :

    ---
    Défauts identifiés :
    ${formattedDefects}
    ---
    État de la checklist :
    ${formattedChecklist}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Error generating report with Gemini:', error);
    return `Une erreur est survenue lors de la génération du rapport. Veuillez réessayer. Détails: ${error instanceof Error ? error.message : String(error)}`;
  }
}
