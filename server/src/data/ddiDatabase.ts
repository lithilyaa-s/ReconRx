export interface DrugDrugInteractionRule {
  interaction_id: number;
  drug_a: string;
  drug_b: string;
  severity: 'Major' | 'Moderate' | 'Minor' | 'Critical';
  mechanism: string;
  clinical_effect: string;
  safer_alternative: string;
  clinical_management: string;
  reference: string;
}

export const DDI_DATABASE: DrugDrugInteractionRule[] = [
  {
    interaction_id: 1,
    drug_a: "Warfarin",
    drug_b: "Ibuprofen",
    severity: "Major",
    mechanism: "Pharmacodynamic (additive antiplatelet effect) & Pharmacokinetic (GI irritation)",
    clinical_effect: "Significantly increased risk of gastrointestinal bleeding and bruising.",
    safer_alternative: "Acetaminophen (Paracetamol)",
    clinical_management: "Avoid concomitant use. If an analgesic is required, choose acetaminophen. Educate the patient on signs of bleeding (melena, bruising). Monitor INR closely if co-administration is unavoidable.",
    reference: "Knox C, Wilson M, Klinger CM, et al. DrugBank 6.0: the DrugBank Knowledgebase for 2024. Nucleic Acids Res. 2024 Jan 5;52(D1):D1265-D1275. doi: 10.1093/nar/gkad976. Interaction Report; Micromedex Solutions"
  },
  {
    interaction_id: 2,
    drug_a: "Simvastatin",
    drug_b: "Clarithromycin",
    severity: "Major",
    mechanism: "Pharmacokinetic: Clarithromycin is a potent CYP3A4 inhibitor, dramatically reducing the metabolism of Simvastatin.",
    clinical_effect: "Increased simvastatin exposure leading to a significantly elevated risk of myopathy and rhabdomyolysis.",
    safer_alternative: "Azithromycin or Amoxicillin",
    clinical_management: "Use a non-CYP3A4 inhibiting antibiotic like azithromycin. If clarithromycin is essential, temporarily withhold simvastatin for the duration of antibiotic therapy. Advise the patient to report any unexplained muscle pain, tenderness, or weakness immediately.",
    reference: "FDA Drug Safety Communication; Knox C, Wilson M, Klinger CM, et al. DrugBank 6.0: the DrugBank Knowledgebase for 2024. Nucleic Acids Res. 2024 Jan 5;52(D1):D1265-D1275. doi: 10.1093/nar/gkad976."
  },
  {
    interaction_id: 3,
    drug_a: "Sertraline",
    drug_b: "Tramadol",
    severity: "Major",
    mechanism: "Pharmacodynamic: Both drugs increase serotonin activity. Tramadol also inhibits serotonin reuptake.",
    clinical_effect: "Increased risk of serotonin syndrome (symptoms: agitation, confusion, tachycardia, hyperthermia, muscle rigidity).",
    safer_alternative: "Morphine or Oxycodone (with caution)",
    clinical_management: "Avoid combination. Choose an opioid with minimal serotonergic activity. If combination is used, monitor closely for symptoms of serotonin syndrome, especially during treatment initiation and dose increases.",
    reference: "FDA Adverse Event Reporting System (FAERS); Sternbach H. The Serotonin Syndrome. Am J Psychiatry. 1991."
  },
  {
    interaction_id: 4,
    drug_a: "Clopidogrel",
    drug_b: "Omeprazole",
    severity: "Moderate",
    mechanism: "Pharmacokinetic: Omeprazole inhibits CYP2C19, the enzyme required to convert clopidogrel into its active metabolite.",
    clinical_effect: "Reduced antiplatelet effect of clopidogrel, potentially increasing the risk of cardiovascular events like stent thrombosis.",
    safer_alternative: "Pantoprazole or Famotidine",
    clinical_management: "Use a PPI with minimal CYP2C19 inhibition (e.g., pantoprazole) or an H2-receptor antagonist (e.g., famotidine). Do not use omeprazole or esomeprazole in patients on clopidogrel.",
    reference: "Clinical Pharmacokinetics; FDA Drug Safety Communication"
  },
  {
    interaction_id: 5,
    drug_a: "Digoxin",
    drug_b: "Verapamil",
    severity: "Major",
    mechanism: "Pharmacokinetic: Verapamil inhibits P-glycoprotein, reducing the renal clearance of digoxin.",
    clinical_effect: "Increased digoxin serum levels, leading to a high risk of toxicity (nausea, vomiting, dizziness, cardiac arrhythmias).",
    safer_alternative: "Amlodipine",
    clinical_management: "Reduce the digoxin dose by 30-50% when initiating verapamil. Monitor digoxin levels closely 5-7 days after starting, stopping, or changing the dose of verapamil. Assess for clinical signs of toxicity.",
    reference: "Goodman & Gilman's Pharmacological Basis of Therapeutics"
  },
  {
    interaction_id: 6,
    drug_a: "Spironolactone",
    drug_b: "Potassium Supplement",
    severity: "Major",
    mechanism: "Pharmacodynamic: Additive potassium-sparing effects.",
    clinical_effect: "Severe hyperkalemia, which can lead to life-threatening cardiac arrhythmias.",
    safer_alternative: "Loop Diuretic (e.g., Furosemide)",
    clinical_management: "AVOID combination. Use a loop diuretic if additional diuresis is needed, as it promotes potassium loss. If combination is absolutely necessary (e.g., in resistant heart failure), monitor serum potassium levels very closely and frequently. Counsel the patient on a low-potassium diet.",
    reference: "Micromedex Solutions; Clinical Pharmacology"
  },
  {
    interaction_id: 7,
    drug_a: "Lithium",
    drug_b: "Ibuprofen",
    severity: "Major",
    mechanism: "Pharmacokinetic: NSAIDs reduce renal blood flow and inhibit prostaglandin synthesis, leading to decreased renal clearance of lithium.",
    clinical_effect: "Increased lithium serum levels, resulting in lithium toxicity (nausea, tremor, confusion, ataxia, renal damage).",
    safer_alternative: "Acetaminophen",
    clinical_management: "Avoid NSAIDs. Use acetaminophen for pain relief. If an NSAID must be used, monitor lithium levels within 5-7 days of initiation and adjust the lithium dose accordingly. Closely monitor for signs of toxicity.",
    reference: "Acta Psychiatr Scand; Knox C, Wilson M, Klinger CM, et al. DrugBank 6.0: the DrugBank Knowledgebase for 2024. Nucleic Acids Res. 2024 Jan 5;52(D1):D1265-D1275. doi: 10.1093/nar/gkad976."
  },
  {
    interaction_id: 8,
    drug_a: "Methotrexate",
    drug_b: "Trimethoprim/Sulfamethoxazole",
    severity: "Major",
    mechanism: "Pharmacodynamic: Both drugs are antifolate agents. Pharmacokinetic: Possible competition for renal secretion.",
    clinical_effect: "Additive myelosuppression (neutropenia, thrombocytopenia) and increased risk of pancytopenia and methotrexate toxicity.",
    safer_alternative: "Pentamidine (for PJP prophylaxis)",
    clinical_management: "Avoid combination, especially in patients on high-dose methotrexate. If co-trimoxazole is essential for Pneumocystis jirovecii pneumonia (PJP) prophylaxis, use with extreme caution, monitor complete blood counts (CBC) weekly, and consider leucovorin rescue.",
    reference: "Arthritis & Rheumatism; Knox C, Wilson M, Klinger CM, et al. DrugBank 6.0: the DrugBank Knowledgebase for 2024. Nucleic Acids Res. 2024 Jan 5;52(D1):D1265-D1275. doi: 10.1093/nar/gkad976."
  },
  {
    interaction_id: 9,
    drug_a: "Sildenafil",
    drug_b: "Nitroglycerin",
    severity: "Major",
    mechanism: "Pharmacodynamic: Both drugs cause vasodilation and potentiate hypotensive effects.",
    clinical_effect: "Profound hypotension, syncope, myocardial infarction, or stroke.",
    safer_alternative: "Alternative angina treatment (e.g., Ranolazine)",
    clinical_management: "CONTRANDICATED combination. Sildenafil is absolutely contraindicated in patients taking any form of nitrates. A washout period of at least 24 hours is required after the last dose of sildenafil before nitrates can be administered.",
    reference: "Knox C, Wilson M, Klinger CM, et al. DrugBank 6.0: the DrugBank Knowledgebase for 2024. Nucleic Acids Res. 2024 Jan 5;52(D1):D1265-D1275. doi: 10.1093/nar/gkad976.; NIH National Library of Medicine"
  },
  {
    interaction_id: 10,
    drug_a: "Phenytoin",
    drug_b: "Ciprofloxacin",
    severity: "Moderate",
    mechanism: "Pharmacokinetic: Ciprofloxacin may inhibit the metabolism of phenytoin, and phenytoin may increase the metabolism of ciprofloxacin.",
    clinical_effect: "Increased phenytoin levels (risk of toxicity: nystagmus, ataxia, drowsiness) and decreased ciprofloxacin levels (risk of therapeutic failure).",
    safer_alternative: "Levofloxacin",
    clinical_management: "Monitor phenytoin levels closely if co-administration is necessary. Consider using an alternative antibiotic that does not interact, such as a third-generation cephalosporin. Adjust doses based on levels and clinical response.",
    reference: "Knox C, Wilson M, Klinger CM, et al. DrugBank 6.0: the DrugBank Knowledgebase for 2024. Nucleic Acids Res. 2024 Jan 5;52(D1):D1265-D1275. doi: 10.1093/nar/gkad976.; Chest Journal"
  }
];

export function findServerDDI(drugA: string, drugB: string): DrugDrugInteractionRule | undefined {
  const normA = drugA.trim().toLowerCase();
  const normB = drugB.trim().toLowerCase();

  return DDI_DATABASE.find(rule => {
    const ruleA = rule.drug_a.toLowerCase();
    const ruleB = rule.drug_b.toLowerCase();

    return (
      (normA.includes(ruleA) || ruleA.includes(normA)) && (normB.includes(ruleB) || ruleB.includes(normB))
    ) || (
      (normA.includes(ruleB) || ruleB.includes(normA)) && (normB.includes(ruleA) || ruleA.includes(normB))
    );
  });
}
