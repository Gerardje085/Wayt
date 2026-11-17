// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Centrale Foutvertaler (Engels / Technisch → Eenvoudig Nederlands)
// ─────────────────────────────────────────────────────────────────────────────

interface FoutRegel {
  match: RegExp;
  tekst: string;
}

const FOUT_REGELS: FoutRegel[] = [
  // ─── Netwerk & Verbinding ─────────────────────────────────────────────────
  {
    match: /network request failed|failed to fetch|networkerror|econnrefused|enotfound|err_network|internet|offline/i,
    tekst: 'Geen internetverbinding. Controleer je wifi of mobiele data en probeer het opnieuw.',
  },
  {
    match: /timeout|timed out|aborterror|etimedout/i,
    tekst: 'Het laden duurde te lang. Controleer je verbinding en probeer het opnieuw.',
  },

  // ─── Inloggen & Registreren (Supabase Auth) ───────────────────────────────
  {
    match: /invalid login credentials|invalid_credentials/i,
    tekst: 'E-mailadres of wachtwoord klopt niet. Controleer je gegevens en probeer het opnieuw.',
  },
  {
    match: /email not confirmed/i,
    tekst: 'Je e-mailadres is nog niet bevestigd. Kijk in je inbox (of spammap) voor de bevestigingslink.',
  },
  {
    match: /user already registered|already been registered|email_exists|already exists/i,
    tekst: 'Er bestaat al een account met dit e-mailadres. Probeer in te loggen.',
  },
  {
    match: /unable to validate email address|invalid format|invalid email/i,
    tekst: 'Dit e-mailadres klopt niet. Controleer of er geen typefout in staat.',
  },
  {
    match: /password should be at least|weak_password|signup requires a valid password/i,
    tekst: 'Je wachtwoord is te kort of te zwak. Gebruik minimaal 6 tekens.',
  },
  {
    match: /same_password|new password should be different/i,
    tekst: 'Kies een nieuw wachtwoord dat anders is dan je huidige wachtwoord.',
  },
  {
    match: /for security purposes, you can only request this after|rate limit|too many requests|over_email_send_rate_limit|\b429\b/i,
    tekst: 'Je hebt het te vaak achter elkaar geprobeerd. Wacht even een minuutje en probeer het opnieuw.',
  },
  {
    match: /signups not allowed|signup is disabled|anonymous sign-ins are disabled/i,
    tekst: 'Registreren is op dit moment niet mogelijk. Neem contact op met de onderzoeker.',
  },
  {
    match: /user not found/i,
    tekst: 'Dit account bestaat niet. Controleer je e-mailadres of maak een nieuw account aan.',
  },
  {
    match: /jwt expired|invalid jwt|session_not_found|auth session missing|refresh_token_not_found|not authenticated/i,
    tekst: 'Je bent automatisch uitgelogd. Log opnieuw in om verder te gaan.',
  },

  // ─── Database & Rechten (Supabase / Postgres / PostgREST) ──────────────────
  {
    match: /row-level security|permission denied|insufficient_privilege|\b42501\b/i,
    tekst: 'Je hebt geen toegang om deze gegevens te bekijken of op te slaan.',
  },
  {
    match: /duplicate key|unique constraint|\b23505\b/i,
    tekst: 'Deze gegevens bestaan al en kunnen niet dubbel worden opgeslagen.',
  },
  {
    match: /foreign key|\b23503\b/i,
    tekst: 'Opslaan mislukt omdat een bijbehorend profiel of gegeven ontbreekt.',
  },
  {
    match: /not-null constraint|null value in column|\b23502\b/i,
    tekst: 'Niet alle verplichte velden zijn ingevuld.',
  },
  {
    match: /check constraint|\b23514\b/i,
    tekst: 'Een van de ingevoerde waarden is niet geldig.',
  },
  {
    match: /invalid input syntax|\b22p02\b/i,
    tekst: 'Ongeldige invoer. Controleer of je geldige getallen hebt ingevuld.',
  },
  {
    match: /pgrst|schema cache|could not find the/i,
    tekst: 'Er ging iets mis met de database. Probeer het later nog eens.',
  },
  {
    match: /internal server error|service unavailable|bad gateway|\b500\b|\b502\b|\b503\b|\b504\b/i,
    tekst: 'De server is tijdelijk niet bereikbaar. Probeer het over een paar minuten opnieuw.',
  },

  // ─── Algemene JS / App-fouten ─────────────────────────────────────────────
  {
    match: /json parse|unexpected token|syntaxerror/i,
    tekst: 'De ontvangen gegevens konden niet goed worden gelezen. Probeer het opnieuw.',
  },
  {
    match: /storage|asyncstorage|quota/i,
    tekst: 'Opslaan op je telefoon is mislukt. Controleer of je genoeg opslagruimte hebt.',
  },
  {
    match: /share|cancel/i,
    tekst: 'Het delen is geannuleerd of mislukt.',
  },
];

function extractRawMessage(fout: unknown): string {
  if (!fout) return '';
  if (typeof fout === 'string') return fout.trim();
  if (typeof fout === 'object') {
    const obj = fout as Record<string, unknown>;
    const delen: string[] = [];
    if (typeof obj.code === 'string') delen.push(obj.code);
    if (typeof obj.message === 'string') delen.push(obj.message);
    if (typeof obj.details === 'string') delen.push(obj.details);
    if (typeof obj.hint === 'string') delen.push(obj.hint);
    return delen.join(' ').trim();
  }
  return String(fout).trim();
}

/**
 * Vertaalt elke technische of Engelstalige foutmelding naar begrijpelijk Nederlands.
 */
export function vertaalFout(
  fout: unknown,
  standaardBericht = 'Er is iets misgegaan. Probeer het opnieuw.',
): string {
  const raw = extractRawMessage(fout);
  if (!raw) return standaardBericht;

  for (const regel of FOUT_REGELS) {
    if (regel.match.test(raw)) {
      return regel.tekst;
    }
  }

  // Fallback zodat er nooit een onbegrijpelijke Engelse of technische tekst zichtbaar is
  return standaardBericht;
}
