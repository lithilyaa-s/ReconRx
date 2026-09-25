import { DiscrepancyItem, MedicationItem, DiscrepancyType, SeverityLevel, Patient } from '../types';
import { findDDI } from '../data/ddiDatabase';

export function normalizeDrugName(name: string): string {
  if (!name) return '';
  let clean = name.toLowerCase().trim();
  // Map common brands to generics
  const brandMap: Record<string, string> = {
    'glucophage': 'metformin',
    'lipitor': 'atorvastatin',
    'norvasc': 'amlodipine',
    'zocor': 'simvastatin',
    'coumadin': 'warfarin',
    'jantoven': 'warfarin',
    'plavix': 'clopidogrel',
    'prilosec': 'omeprazole',
    'lasix': 'furosemide',
    'aldactone': 'spironolactone',
    'zoloft': 'sertraline',
    'ultram': 'tramadol',
    'synthroid': 'levothyroxine',
    'lanoxin': 'digoxin',
    'calan': 'verapamil',
    'motrin': 'ibuprofen',
    'advil': 'ibuprofen',
    'tylenol': 'acetaminophen',
    'bactrim': 'trimethoprim/sulfamethoxazole',
    'viagra': 'sildenafil',
    'dilantin': 'phenytoin',
    'diflucan': 'fluconazole',
    'depakote': 'valproic acid',
    'lamictal': 'lamotrigine',
    'zyvox': 'linezolid',
    'cardizem': 'diltiazem',
    'lopressor': 'metoprolol',
    'zyprexa': 'olanzapine',
    'valium': 'diazepam',
    'seroquel': 'quetiapine',
    'effexor': 'venlafaxine',
    'prozac': 'fluoxetine',
    'risperdal': 'risperidone'
  };

  for (const [brand, generic] of Object.entries(brandMap)) {
    if (clean.includes(brand)) {
      return generic;
    }
  }

  // Remove salt forms
  clean = clean.replace(/\b(hydrochloride|besylate|calcium|sodium|tartrate|succinate|maleate)\b/gi, '').trim();
  return clean;
}

export function parseDosageNumber(doseStr?: string): number | null {
  if (!doseStr) return null;
  const match = doseStr.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

export function runReconciliationAlgorithm(
  patient: Patient,
  previousMeds: MedicationItem[],
  currentMeds: MedicationItem[]
): DiscrepancyItem[] {
  const discrepancies: DiscrepancyItem[] = [];
  const processedCurrentIds = new Set<string>();

  // 1. Evaluate previous medications against current medications
  for (const prev of previousMeds) {
    const normPrevName = normalizeDrugName(prev.name);
    
    // Find matching current medication
    const matchedCurr = currentMeds.find(c => {
      const normCurrName = normalizeDrugName(c.name);
      return normPrevName.includes(normCurrName) || normCurrName.includes(normPrevName);
    });

    if (!matchedCurr) {
      // Potential omission
      discrepancies.push({
        id: `disc-omission-${prev.id}`,
        medicationName: prev.name,
        genericName: prev.genericName || prev.name,
        type: 'POTENTIAL_OMISSION',
        severity: 'Critical',
        status: 'REQUIRES_REVIEW',
        previousRecord: {
          dose: prev.dose,
          frequency: prev.frequency,
          route: prev.route,
          sourceDate: prev.prescribedDate || 'Prior Record',
          sourceName: prev.source
        },
        currentRecord: null,
        aiObservation: `Medication "${prev.name} ${prev.dose}" was active in the previous regimen but does not appear in the current inpatient orders.`,
        clinicalExplanation: `Unintended omission of chronic medication at care transition. Stopping essential chronic therapies abruptly may precipitate clinical decompensation.`,
        suggestedAction: `Verify whether ${prev.name} was intentionally held (e.g. clinical contraindication, acute illness) or inadvertently omitted during admission order entry.`
      });
    } else {
      processedCurrentIds.add(matchedCurr.id);
      
      const prevDoseNum = parseDosageNumber(prev.dose);
      const currDoseNum = parseDosageNumber(matchedCurr.dose);
      const doseDiffers = prevDoseNum !== null && currDoseNum !== null && prevDoseNum !== currDoseNum;
      const freqDiffers = prev.frequency.trim().toLowerCase() !== matchedCurr.frequency.trim().toLowerCase();
      const routeDiffers = prev.route.trim().toLowerCase() !== matchedCurr.route.trim().toLowerCase();

      if (doseDiffers && freqDiffers) {
        discrepancies.push({
          id: `disc-change-${prev.id}-${matchedCurr.id}`,
          medicationName: matchedCurr.name,
          genericName: matchedCurr.genericName || prev.genericName,
          type: 'DOSE_FREQUENCY_CHANGE',
          severity: 'Major',
          status: 'REQUIRES_REVIEW',
          previousRecord: {
            dose: prev.dose,
            frequency: prev.frequency,
            route: prev.route,
            sourceDate: prev.prescribedDate,
            sourceName: prev.source
          },
          currentRecord: {
            dose: matchedCurr.dose,
            frequency: matchedCurr.frequency,
            route: matchedCurr.route,
            orderDate: matchedCurr.prescribedDate,
            prescriber: matchedCurr.prescribingDoctor
          },
          aiObservation: `Both dose and frequency were modified: from ${prev.dose} (${prev.frequency}) to ${matchedCurr.dose} (${matchedCurr.frequency}).`,
          clinicalExplanation: `Dose/frequency escalation or de-escalation detected. Ensure patient organ function supports the revised regimen.`,
          suggestedAction: `Confirm whether this transition was intentional and supported by the current inpatient diagnostic plan.`
        });
      } else if (doseDiffers) {
        discrepancies.push({
          id: `disc-dose-${prev.id}-${matchedCurr.id}`,
          medicationName: matchedCurr.name,
          genericName: matchedCurr.genericName,
          type: 'DOSE_CHANGE',
          severity: 'Major',
          status: 'REQUIRES_REVIEW',
          previousRecord: {
            dose: prev.dose,
            frequency: prev.frequency,
            route: prev.route,
            sourceDate: prev.prescribedDate,
            sourceName: prev.source
          },
          currentRecord: {
            dose: matchedCurr.dose,
            frequency: matchedCurr.frequency,
            route: matchedCurr.route,
            orderDate: matchedCurr.prescribedDate,
            prescriber: matchedCurr.prescribingDoctor
          },
          aiObservation: `Strength changed from ${prev.dose} to ${matchedCurr.dose} with identical frequency.`,
          clinicalExplanation: `Dose alteration identified across care boundary.`,
          suggestedAction: `Validate patient tolerability and confirm therapeutic dosing target.`
        });
      } else if (freqDiffers) {
        discrepancies.push({
          id: `disc-freq-${prev.id}-${matchedCurr.id}`,
          medicationName: matchedCurr.name,
          genericName: matchedCurr.genericName,
          type: 'FREQUENCY_CHANGE',
          severity: 'Moderate',
          status: 'REQUIRES_REVIEW',
          previousRecord: {
            dose: prev.dose,
            frequency: prev.frequency,
            route: prev.route,
            sourceDate: prev.prescribedDate,
            sourceName: prev.source
          },
          currentRecord: {
            dose: matchedCurr.dose,
            frequency: matchedCurr.frequency,
            route: matchedCurr.route,
            orderDate: matchedCurr.prescribedDate,
            prescriber: matchedCurr.prescribingDoctor
          },
          aiObservation: `Frequency changed from "${prev.frequency}" to "${matchedCurr.frequency}".`,
          clinicalExplanation: `Timing or administration frequency changed.`,
          suggestedAction: `Verify timing schedules and clinical justification.`
        });
      } else if (routeDiffers) {
        discrepancies.push({
          id: `disc-route-${prev.id}-${matchedCurr.id}`,
          medicationName: matchedCurr.name,
          type: 'ROUTE_CHANGE',
          severity: 'Moderate',
          status: 'REQUIRES_REVIEW',
          previousRecord: {
            dose: prev.dose,
            frequency: prev.frequency,
            route: prev.route,
            sourceDate: prev.prescribedDate,
            sourceName: prev.source
          },
          currentRecord: {
            dose: matchedCurr.dose,
            frequency: matchedCurr.frequency,
            route: matchedCurr.route,
            orderDate: matchedCurr.prescribedDate,
            prescriber: matchedCurr.prescribingDoctor
          },
          aiObservation: `Route modified from ${prev.route} to ${matchedCurr.route}.`,
          clinicalExplanation: `Route change (e.g. IV to Oral transition or vice versa).`,
          suggestedAction: `Confirm clinical readiness for route transition.`
        });
      } else {
        // Unchanged
        discrepancies.push({
          id: `disc-unchanged-${prev.id}-${matchedCurr.id}`,
          medicationName: matchedCurr.name,
          genericName: matchedCurr.genericName,
          type: 'UNCHANGED',
          severity: 'Info',
          status: 'REVIEWED',
          previousRecord: {
            dose: prev.dose,
            frequency: prev.frequency,
            route: prev.route,
            sourceDate: prev.prescribedDate,
            sourceName: prev.source
          },
          currentRecord: {
            dose: matchedCurr.dose,
            frequency: matchedCurr.frequency,
            route: matchedCurr.route,
            orderDate: matchedCurr.prescribedDate,
            prescriber: matchedCurr.prescribingDoctor
          },
          aiObservation: `Dosage, frequency, and route are identical across both records.`,
          clinicalExplanation: `Regimen verified consistent across transition of care.`,
          suggestedAction: `No action required. Order verified.`,
          resolution: {
            action: 'VERIFIED_CORRECT',
            rationale: 'Verified concordant between outpatient and current records.',
            reviewedBy: 'Dr. Ananya Sharma',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        });
      }
    }
  }

  // 2. Evaluate remaining current medications (Newly added)
  for (const curr of currentMeds) {
    if (!processedCurrentIds.has(curr.id)) {
      discrepancies.push({
        id: `disc-new-${curr.id}`,
        medicationName: curr.name,
        genericName: curr.genericName,
        type: 'NEW_MEDICATION',
        severity: 'Moderate',
        status: 'REQUIRES_REVIEW',
        previousRecord: null,
        currentRecord: {
          dose: curr.dose,
          frequency: curr.frequency,
          route: curr.route,
          orderDate: curr.prescribedDate || 'Current Encounter',
          prescriber: curr.prescribingDoctor
        },
        aiObservation: `Newly introduced medication not found in prior outpatient records.`,
        clinicalExplanation: `New therapy initiated during this clinical encounter. Verify therapeutic indication and absence of hypersensitivities.`,
        suggestedAction: `Confirm clinical rationale with admitting physician and review against patient contraindications.`
      });
    }
  }

  // 3. Evaluate Drug-Drug Interactions across all current medications using trained DDI database
  for (let i = 0; i < currentMeds.length; i++) {
    for (let j = i + 1; j < currentMeds.length; j++) {
      const drugA = currentMeds[i].name;
      const drugB = currentMeds[j].name;
      const ddi = findDDI(drugA, drugB);
      if (ddi) {
        discrepancies.push({
          id: `disc-ddi-${i}-${j}`,
          medicationName: `${ddi.drug_a} + ${ddi.drug_b} Interaction`,
          type: 'DRUG_DRUG_INTERACTION',
          severity: ddi.severity === 'Major' ? 'Critical' : 'Major',
          status: 'REQUIRES_REVIEW',
          previousRecord: null,
          currentRecord: {
            dose: `${currentMeds[i].name} (${currentMeds[i].dose}) + ${currentMeds[j].name} (${currentMeds[j].dose})`,
            frequency: 'Co-prescribed'
          },
          aiObservation: `High-risk Drug-Drug Interaction detected: ${ddi.mechanism}.`,
          clinicalExplanation: `${ddi.clinical_effect} (Reference: ${ddi.reference})`,
          suggestedAction: `${ddi.clinical_management} Recommended alternative: ${ddi.safer_alternative}.`,
          ddiDetails: ddi
        });
      }
    }
  }

  // 4. Evaluate Patient Allergy Conflicts
  for (const curr of currentMeds) {
    const normCurr = curr.name.toLowerCase();
    for (const allergy of patient.allergies) {
      const normAllergy = allergy.toLowerCase();
      if (
        (normAllergy.includes('penicillin') && (normCurr.includes('amoxicillin') || normCurr.includes('ampicillin') || normCurr.includes('penicillin'))) ||
        (normAllergy.includes('sulfa') && (normCurr.includes('sulfamethoxazole') || normCurr.includes('bactrim'))) ||
        (normAllergy.includes('aspirin') && (normCurr.includes('aspirin') || normCurr.includes('acetylsalicylic') || normCurr.includes('ibuprofen')))
      ) {
        discrepancies.push({
          id: `disc-allergy-${curr.id}`,
          medicationName: `${curr.name} (Allergy Alert)`,
          type: 'ALLERGY_CONTRAINDICATION',
          severity: 'Critical',
          status: 'REQUIRES_REVIEW',
          previousRecord: null,
          currentRecord: {
            dose: curr.dose,
            frequency: curr.frequency,
            route: curr.route
          },
          aiObservation: `Patient has documented allergy: "${allergy}". Prescribed medication belongs to the reactive drug class.`,
          clinicalExplanation: `Severe hypersensitivity risk. Prescribing in allergic patients may cause anaphylaxis or cutaneous reactions.`,
          suggestedAction: `Hold medication immediately. Consult prescribing physician for a non-cross-reactive alternative.`,
          allergyConflict: allergy
        });
      }
    }
  }

  return discrepancies;
}
