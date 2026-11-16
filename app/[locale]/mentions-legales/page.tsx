import LegalPage, { Section, Todo } from "@/components/LegalPage"

export const metadata = { title: "Mentions légales — cvolt" }

export default async function MentionsLegales({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <LegalPage locale={locale} title="Mentions légales" updated="16 novembre 2026">
      <Section title="Éditeur du site">
        <p>
          Le site cvolt est édité par la société <strong>SERVICE FLOW OPERATIONS</strong>, société à responsabilité
          limitée unipersonnelle (EURL) en cours de création depuis le 12/10/2026.
          <br />Siège social : 149 avenue du Maine, 75014 Paris, France
          <br />Immatriculation : en cours d&apos;immatriculation au Registre du Commerce et des Sociétés (RCS) de Paris
          <br />Représentée par : Adams Ohikere SALAMAT, gérant
          <br />Directeur de la publication : Adams Ohikere SALAMAT
        </p>
      </Section>
      <Section id="contact" title="Contact">
        <p>
          E-mail : <a href="mailto:salamat.adams@outlook.fr">salamat.adams@outlook.fr</a>
          <br />Téléphone : 07 67 16 27 84
        </p>
      </Section>
      <Section title="Hébergement">
        <p>
          Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com.
          <br />Base de données hébergée par <Todo>nom et adresse du prestataire de base de données (ex. Neon, Supabase)</Todo>
        </p>
      </Section>
      <Section title="Propriété intellectuelle">
        <p>
          La marque cvolt, le site, ses textes, graphismes et logiciels sont protégés. Toute reproduction sans
          autorisation écrite est interdite. Les CV et contenus que vous importez restent votre propriété.
        </p>
      </Section>
      <Section title="Données personnelles">
        <p>
          Le traitement de vos données est décrit dans notre <a href={`/${locale}/confidentialite`}>politique de confidentialité</a>.
        </p>
      </Section>
    </LegalPage>
  )
}
