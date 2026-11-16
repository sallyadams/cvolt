import LegalPage, { Section, Todo } from "@/components/LegalPage"

export const metadata = { title: "Conditions générales (CGU / CGV) — cvolt" }

export default async function Conditions({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <LegalPage locale={locale} title="Conditions générales d'utilisation et de vente" updated="16 novembre 2026">
      <Section title="1. Objet">
        <p>
          Ces conditions encadrent l&apos;utilisation de cvolt, service en ligne d&apos;aide à la recherche d&apos;emploi
          (analyse de CV, adaptation aux offres, lettres de motivation, préparation d&apos;entretien, suivi de candidatures),
          édité par <Todo>nom ou raison sociale de l&apos;éditeur</Todo>. Créer un compte vaut acceptation de ces conditions.
        </p>
      </Section>
      <Section title="2. Compte">
        <p>
          Vous devez avoir au moins 16 ans, fournir des informations exactes et garder votre mot de passe confidentiel.
          Vous êtes responsable des contenus que vous importez et vous garantissez en avoir le droit.
        </p>
      </Section>
      <Section title="3. Formules et prix">
        <ul>
          <li>Gratuit : 0 €, fonctionnalités et volumes limités.</li>
          <li>Pro : 9 € TTC par mois.</li>
          <li>Premium : 19 € TTC par mois.</li>
        </ul>
        <p>Le contenu de chaque formule est décrit sur la page Tarifs au moment de la souscription.</p>
      </Section>
      <Section title="4. Paiement, renouvellement et résiliation">
        <p>
          Le paiement se fait par carte via Stripe. L&apos;abonnement est mensuel et se renouvelle automatiquement à
          chaque échéance. Vous pouvez le résilier à tout moment depuis votre espace ; l&apos;accès reste ouvert jusqu&apos;à
          la fin de la période payée, sans remboursement au prorata.
        </p>
      </Section>
      <Section title="5. Droit de rétractation">
        <p>
          Vous disposez de 14 jours après la souscription pour vous rétracter (article L221-18 du Code de la consommation),
          en écrivant à <Todo>adresse e-mail de contact</Todo>. Si vous demandez à utiliser le service immédiatement
          et reconnaissez perdre votre droit de rétractation une fois le contenu numérique fourni (article L221-28),
          la rétractation n&apos;est plus possible pour les fonctionnalités déjà utilisées.
        </p>
      </Section>
      <Section title="6. Intelligence artificielle et absence de garantie d'embauche">
        <p>
          Les analyses et textes sont générés par une IA et peuvent contenir des erreurs ou des approximations.
          Vous restez seul responsable de ce que vous envoyez aux recruteurs. cvolt aide à préparer vos candidatures
          mais ne garantit ni entretien ni embauche.
        </p>
      </Section>
      <Section title="7. Responsabilité">
        <p>
          cvolt est fourni avec soin mais peut connaître des interruptions (maintenance, panne d&apos;un prestataire).
          Notre responsabilité est limitée aux dommages directs et au montant payé au cours des 12 derniers mois,
          sauf faute lourde ou disposition légale contraire.
        </p>
      </Section>
      <Section title="8. Données personnelles">
        <p>
          Voir notre <a href={`/${locale}/confidentialite`}>politique de confidentialité</a>.
        </p>
      </Section>
      <Section title="9. Médiation et droit applicable">
        <p>
          En cas de litige, contactez-nous d&apos;abord à <Todo>adresse e-mail de contact</Todo>. Vous pouvez ensuite
          recourir gratuitement au médiateur de la consommation : <Todo>nom et site du médiateur choisi</Todo>.
          Ces conditions sont soumises au droit français.
        </p>
      </Section>
    </LegalPage>
  )
}
