import LegalPage, { Section, Todo } from "@/components/LegalPage"

export const metadata = { title: "Mentions légales — cvolt" }

export default async function MentionsLegales({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <LegalPage locale={locale} title="Mentions légales" updated="16 novembre 2026">
      <Section title="Éditeur du site">
        <p>
          Le site cvolt est édité par <Todo>nom et prénom suivis de « EI », ou raison sociale et forme (ex. SASU)</Todo>
          <br />Numéro SIREN : <Todo>SIREN</Todo>
          <br />Adresse : <Todo>adresse postale</Todo>
          <br />Numéro de TVA intracommunautaire : <Todo>numéro de TVA ou « non applicable, art. 293 B du CGI »</Todo>
          <br />Directrice de la publication : Salamat Adams
        </p>
      </Section>
      <Section id="contact" title="Contact">
        <p>
          E-mail : <Todo>adresse e-mail de contact</Todo>
          <br />Téléphone : <Todo>numéro de téléphone</Todo>
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
