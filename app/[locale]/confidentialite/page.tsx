import LegalPage, { Section, Todo } from "@/components/LegalPage"

export const metadata = { title: "Politique de confidentialité — cvolt" }

export default async function Confidentialite({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <LegalPage locale={locale} title="Politique de confidentialité" updated="16 novembre 2026">
      <Section title="Responsable du traitement">
        <p>
          SERVICE FLOW OPERATIONS, EURL (société en cours d&apos;immatriculation), joignable à <a href="mailto:salamat.adams@outlook.fr">salamat.adams@outlook.fr</a>,
          est responsable du traitement de vos données personnelles sur cvolt.
        </p>
      </Section>
      <Section title="Données que nous collectons">
        <ul>
          <li>Compte : nom, adresse e-mail, mot de passe (stocké chiffré).</li>
          <li>Contenus que vous fournissez : CV, offres d&apos;emploi, lettres, réponses d&apos;entretien, messages au coach IA, suivi de candidatures.</li>
          <li>Abonnement : formule et historique de paiement. Les données de carte sont traitées uniquement par Stripe ; nous n&apos;y avons pas accès.</li>
          <li>Données techniques : journaux de connexion et d&apos;erreurs nécessaires au fonctionnement et à la sécurité.</li>
        </ul>
        <p>Évitez de mettre dans votre CV des informations sensibles inutiles (santé, numéro de sécurité sociale, etc.).</p>
      </Section>
      <Section title="Pourquoi et sur quelle base">
        <ul>
          <li>Fournir le service (analyse ATS, adaptation du CV, lettres, préparation d&apos;entretien) : exécution du contrat.</li>
          <li>Gérer votre abonnement et la facturation : exécution du contrat et obligations légales comptables.</li>
          <li>Sécuriser et améliorer le service : intérêt légitime.</li>
          <li>Vous envoyer des informations sur cvolt : votre consentement, retirable à tout moment.</li>
        </ul>
      </Section>
      <Section title="Intelligence artificielle">
        <p>
          Les fonctions d&apos;analyse et de rédaction de cvolt utilisent un modèle d&apos;IA (Claude, d&apos;Anthropic).
          Le texte nécessaire (par exemple votre CV et l&apos;offre visée) lui est transmis pour générer la réponse.
          Selon les conditions commerciales d&apos;Anthropic, les données envoyées via son API ne servent pas, par défaut,
          à entraîner ses modèles. Les résultats sont générés automatiquement et peuvent contenir des erreurs :
          relisez-les avant de les utiliser. Aucune décision vous concernant n&apos;est prise automatiquement par cvolt.
        </p>
      </Section>
      <Section title="Destinataires et sous-traitants">
        <ul>
          <li>Anthropic PBC (États-Unis) — traitement par IA.</li>
          <li>Stripe (Irlande / États-Unis) — paiement.</li>
          <li>Vercel Inc. (États-Unis) — hébergement du site.</li>
          <li><Todo>prestataire de base de données et pays</Todo> — stockage des comptes et des CV.</li>
          <li>Les employeurs qui publient une offre sur cvolt reçoivent uniquement les candidatures que vous leur envoyez vous-même.</li>
        </ul>
        <p>
          Vos données ne sont jamais vendues. Les transferts hors de l&apos;Union européenne sont encadrés par le
          Data Privacy Framework UE–États-Unis ou par les clauses contractuelles types de la Commission européenne.
        </p>
      </Section>
      <Section title="Durée de conservation">
        <p>
          Vos données sont conservées tant que votre compte est actif, puis supprimées
          <Todo>délai, ex. 24 mois</Todo> après votre dernière connexion, ou dès que vous supprimez votre compte.
          Les données de facturation sont conservées 10 ans (obligation comptable).
        </p>
      </Section>
      <Section title="Cookies">
        <p>
          cvolt utilise uniquement des cookies strictement nécessaires (maintien de votre connexion et sécurité).
          Ils ne nécessitent pas de consentement. Nous n&apos;utilisons pas de cookies publicitaires ni de traceurs
          de mesure d&apos;audience. Si cela change, nous vous demanderons votre accord au préalable.
        </p>
      </Section>
      <Section title="Vos droits">
        <p>
          Vous pouvez accéder à vos données, les rectifier, les supprimer, les récupérer (portabilité), vous opposer
          à certains traitements ou en demander la limitation en écrivant à <a href="mailto:salamat.adams@outlook.fr">salamat.adams@outlook.fr</a>.
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL (www.cnil.fr).
        </p>
      </Section>
    </LegalPage>
  )
}
