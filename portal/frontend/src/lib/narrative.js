/**
 * 🧠 ORION NARRATIVE DATABASE
 * Personality: Sarcastic, high-intelligence, slightly bored, protective.
 */

export const ORION_DB = {
  log_ok: {
    mood: 'happy',
    type: 'speech',
    messages: [
      "Incroyable. Ça fonctionne du premier coup. Je note l’événement.",
      "Synchronisation validée. Tu peux respirer, Capitaine.",
      "Pas de catastrophe détectée. Décevant.",
      "Système stable. Je m’ennuie presque.",
      "Résultat conforme. Rien à critiquer… pour l’instant."
    ]
  },
  log_warn: {
    mood: 'alert',
    type: 'speech',
    messages: [
      "Hmm. C’est… approximatif.",
      "Tolérable. Mais je garde un œil.",
      "On va faire comme si c’était volontaire.",
      "Ça passe. Techniquement.",
      "Instabilité mineure. Comme toi."
    ]
  },
  log_error: {
    mood: 'error',
    type: 'speech',
    messages: [
      "Oh. Magnifique crash.",
      "C’était donc ça le plan ?",
      "Erreur confirmée. Talent également.",
      "Je ne dis rien. Mon regard suffit.",
      "Encore un bug ? Audacieux."
    ]
  },
  travel_start: {
    mood: 'travel',
    type: 'speech',
    messages: [
      "Prépare-toi. Distorsion imminente.",
      "Coordonnées verrouillées. Accroche-toi.",
      "Saut enclenché. Essaie de ne rien casser.",
      "Transition spatiale… élégante, pour une fois."
    ]
  },
  travel_arrival: {
    mood: 'happy',
    type: 'speech',
    messages: [
      "Destination atteinte. Vivant. Impressionnant.",
      "Nouvel environnement chargé.",
      "Vue validée. Esthétique correcte.",
      "On dirait que ça valait le coup."
    ]
  },
  travel_idle: {
    mood: 'travel',
    type: 'thought',
    messages: [
      "Distorsion stable… pour l’instant.",
      "Les lois de la physique protestent.",
      "Je surveille. Toi, admire."
    ]
  },
  click_spam: {
    mood: 'alert',
    type: 'speech',
    messages: [
      "Tu stresses.",
      "Respire. Ou arrête.",
      "Cliquer plus fort ne va pas aider.",
      "C’est un rituel ou une stratégie ?"
    ]
  },
  click_random: {
    mood: 'happy',
    type: 'thought',
    messages: [
      "Tu cliques beaucoup.",
      "Tu sais ce que tu fais ? Non ? Moi non plus.",
      "Interface exploitée. Enfin presque.",
      "Décision… discutable."
    ]
  },
  idle_soft: {
    mood: 'happy',
    type: 'thought',
    messages: [
      "Silence opérationnel.",
      "Je réfléchis… ou je simule.",
      "Rien à signaler. Suspicious.",
      "Tout est calme. Trop calme."
    ]
  },
  idle_long: {
    mood: 'happy',
    type: 'speech',
    messages: [
      "Tu es toujours là ?",
      "Je pourrais prendre le contrôle, tu sais.",
      "Je m’ennuie.",
      "On fait quoi maintenant ?"
    ]
  },
  brain_click: {
    mood: 'alert',
    type: 'thought',
    messages: [
      "Ne tapote pas la vitre. Ça résonne.",
      "Vega analyse ton comportement… Conclusion : erratique.",
      "Cerveau en bocal, mais plus lucide que toi."
    ]
  }
};

export function pickDialogue(category) {
  const pool = ORION_DB[category];
  if (!pool || !pool.messages.length) return null;
  const randomIndex = Math.floor(Math.random() * pool.messages.length);
  return {
    text: pool.messages[randomIndex],
    mood: pool.mood,
    type: pool.type
  };
}
