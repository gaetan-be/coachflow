import { Link } from 'react-router-dom';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F6F7F9] flex flex-col items-center px-5 py-16">
      <div
        className="bg-white border border-[#EAEDEF] rounded-2xl p-14 w-full max-w-[760px] text-left
                   shadow-[0_1px_4px_rgba(32,44,52,0.04)] animate-fade-up
                   max-md:p-9 max-sm:p-7"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full border-[1.5px] border-[#40A2C0] flex items-center justify-center font-[Fraunces,serif] text-base text-[#40A2C0] font-medium">
            B
          </div>
          <span className="text-xs font-medium tracking-[3px] uppercase">BRENSO</span>
        </div>

        <h1 className="font-[Fraunces,serif] text-[32px] font-normal text-[#202C34] mb-2 leading-snug max-sm:text-[26px]">
          Politique de confidentialité et conditions d'utilisation
        </h1>
        <div className="text-[12px] tracking-[2px] uppercase text-[#6B7580] mb-10">
          Dernière mise à jour : avril 2026
        </div>

        <div className="bg-[rgba(64,162,192,0.08)] border border-[rgba(64,162,192,0.2)] rounded-[10px] px-5 py-4 mb-8">
          <p className="text-[14px] leading-[1.7] text-[#6B7580] m-0">
            <strong className="text-[#202C34] font-semibold">En résumé :</strong> Brenso collecte uniquement les informations
            nécessaires au coach pour préparer votre entretien. Vos données sont
            stockées en Europe, chez OVH, et ne sont jamais revendues ni partagées à
            des fins commerciales. Pour la rédaction du rapport, nous faisons appel à
            un service d'intelligence artificielle situé aux États-Unis : votre{' '}
            <strong className="text-[#202C34] font-semibold">prénom réel n'y est jamais envoyé</strong>, il est remplacé par un
            prénom fictif le temps de la génération — voir la section 5.
          </p>
        </div>

        <Section title="1. Qu'est-ce que Brenso ?">
          <p>
            Brenso est une plateforme utilisée par des coachs d'orientation pour
            accompagner des jeunes dans le choix de leurs études. Le jeune remplit un
            court questionnaire en ligne, que le coach consulte avant la première
            séance afin d'adapter son accompagnement.
          </p>
        </Section>

        <Section title="2. Quelles données collectons-nous ?">
          <p>
            Nous appliquons le principe de <strong>minimisation des données</strong> :
            nous ne conservons que ce qui est strictement utile au coaching.
          </p>
          <ul>
            <li>Prénom, nom, date de naissance</li>
            <li>Établissement scolaire et année en cours</li>
            <li>Orientation actuelle, loisirs, pistes de métiers envisagées</li>
            <li>Profils comportementaux identifiés par le coach à partir des questionnaires de profil</li>
            <li>Le rapport d'orientation généré par le coach</li>
          </ul>
          <p>
            Aucune donnée sensible au sens du RGPD n'est demandée : ni
            numéro d'identification nationale, ni donnée de santé, ni
            opinions politiques ou religieuses.
          </p>
        </Section>

        <Section title="3. À quoi servent ces données ?">
          <p>Elles servent <strong>uniquement</strong> à :</p>
          <ul>
            <li>permettre au coach de préparer et mener l'accompagnement ;</li>
            <li>produire le rapport d'orientation remis au jeune et à sa famille.</li>
          </ul>
          <p>
            Elles ne sont <strong>jamais</strong> revendues, partagées avec des
            tiers commerciaux, ni utilisées à des fins publicitaires ou
            statistiques externes.
          </p>
        </Section>

        <Section title="4. Sur quelle base légale collectons-nous ces données ?">
          <p>
            Le traitement de vos données repose sur deux bases juridiques prévues
            par le RGPD :
          </p>
          <ul>
            <li>
              <strong>Votre consentement</strong> (article 6.1.a du RGPD) lorsque vous
              remplissez le questionnaire en ligne ;
            </li>
            <li>
              <strong>L'exécution du contrat de coaching</strong> (article 6.1.b du
              RGPD) entre le coach et vous (ou vos parents/représentants légaux),
              pour la préparation des séances et la production du rapport.
            </li>
          </ul>
          <p>
            <strong>Le questionnaire est-il obligatoire ?</strong> Non, il n'y a
            aucune obligation légale à le remplir. En revanche, il est{' '}
            <em>nécessaire</em> au bon déroulement du coaching : sans ces
            informations, le coach ne peut pas préparer la séance ni rédiger un
            rapport personnalisé.
          </p>
        </Section>

        <Section title="5. Où sont stockées les données ?">
          <p>
            L'ensemble du stockage (base de données, rapports générés,
            sauvegardes) est hébergé <strong>dans l'Union Européenne</strong>,
            sur l'infrastructure d'<strong>OVH</strong> (France).
          </p>
          <p>
            <strong>Pseudonymisation pour la génération du rapport :</strong>
            {' '}pour rédiger les chapitres du rapport, Brenso utilise un modèle
            d'intelligence artificielle fourni par <strong>Anthropic</strong>
            {' '}(États-Unis). Avant tout envoi, les données du jeune sont
            <strong> pseudonymisées</strong> : son prénom réel est remplacé
            par un prénom fictif tiré au hasard. Le prénom d'origine est
            réinséré dans le rapport final uniquement après réception du
            texte généré.
          </p>
          <p>Seules les informations suivantes sont transmises, et toujours sous forme pseudonymisée :</p>
          <ul>
            <li>un <strong>prénom fictif</strong> à la place du prénom réel ;</li>
            <li>les profils comportementaux du jeune, sous forme de codes abrégés ;</li>
            <li>les compétences, besoins et valeurs identifiés par le coach ;</li>
            <li>les pistes de métiers évoquées en séance ;</li>
            <li>les notes analytiques rédigées par le coach et le plan d'action proposé.</li>
          </ul>
          <p>
            Ne sont <strong>jamais</strong> transmis : le prénom réel, le nom de
            famille, la date de naissance, l'établissement scolaire, ni aucune autre
            donnée directement identifiante. À partir des seules informations
            reçues, Anthropic n'est pas en mesure d'identifier la personne concernée.
          </p>
          <p>
            Ce transfert est encadré par le <strong>Data Privacy Framework
            UE–États-Unis</strong>, dont Anthropic est certifié, et par les
            clauses contractuelles types (SCC) de la Commission européenne.
            Anthropic s'engage à ne pas utiliser les données transmises via son
            API pour entraîner ses modèles.
          </p>
        </Section>

        <Section title="6. Rôle de l'IA et décision automatisée">
          <p>
            Le rapport d'orientation est rédigé avec l'assistance d'un modèle
            d'intelligence artificielle, à partir des données pseudonymisées
            décrites à la section 5. Le texte généré est ensuite{' '}
            <strong>relu, validé et le cas échéant modifié par votre coach</strong>
            {' '}avant d'être transmis.
          </p>
          <p>
            Aucune décision produisant des effets juridiques ou vous affectant de
            manière significative n'est prise de manière purement automatisée :
            le rapport est un outil d'aide à la réflexion remis au jeune et à sa
            famille, et le choix d'orientation reste entièrement entre vos mains.
          </p>
        </Section>

        <Section title="7. Qui est responsable ?">
          <p><strong>Responsable de traitement (Data Controller)</strong></p>
          <ul><li>Narido.eu</li></ul>
          <p><strong>Sous-traitants (Data Processors)</strong></p>
          <ul>
            <li><strong>OVH</strong> (UE) — hébergement et infrastructure</li>
            <li><strong>Narido.eu</strong> (UE) — exploitation et maintenance de la plateforme</li>
            <li>
              <strong>Anthropic</strong> (États-Unis) — génération du texte
              du rapport via son API Claude, sous couvert du Data Privacy Framework UE–US
            </li>
          </ul>
        </Section>

        <Section title="8. Combien de temps les données sont-elles conservées ?">
          <p>
            Les données d'un coachee sont conservées le temps de la mission
            d'accompagnement. Au terme de celle-ci, elles peuvent être supprimées
            sur simple demande, ou archivées uniquement si le coach et le jeune
            conviennent d'un suivi dans le temps.
          </p>
        </Section>

        <Section title="9. Vos droits (RGPD)">
          <p>Conformément au Règlement Général sur la Protection des
          Données (RGPD), vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Accès</strong> : savoir quelles données nous détenons sur vous</li>
            <li><strong>Rectification</strong> : faire corriger une information inexacte</li>
            <li><strong>Effacement</strong> : demander la suppression de vos données</li>
            <li><strong>Limitation</strong> : restreindre le traitement de vos données</li>
            <li><strong>Portabilité</strong> : récupérer vos données dans un format réutilisable</li>
            <li><strong>Opposition</strong> : vous opposer au traitement</li>
          </ul>
          <p>
            Pour exercer l'un de ces droits, il suffit d'écrire à{' '}
            <a href="mailto:contact@narido.eu" className="text-[#40A2C0] no-underline border-b border-[rgba(64,162,192,0.3)] hover:text-[#202C34]">
              contact@narido.eu
            </a>.
          </p>
        </Section>

        <Section title="10. Sécurité">
          <p>
            L'accès à l'espace coach est protégé par identifiant et mot de
            passe. Les communications sont chiffrées (HTTPS/TLS). Les mots de passe
            sont stockés sous forme hachée et ne sont jamais accessibles en clair.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Pour toute question concernant vos données ou cette page :{' '}
            <a href="mailto:contact@narido.eu" className="text-[#40A2C0] no-underline border-b border-[rgba(64,162,192,0.3)] hover:text-[#202C34]">
              contact@narido.eu
            </a>
          </p>
        </Section>

        <Link
          to="/"
          className="inline-block mt-8 text-[12px] tracking-[2px] uppercase text-[#6B7580] no-underline hover:text-[#40A2C0] transition-colors"
        >
          ← Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="font-[Fraunces,serif] text-[22px] font-normal text-[#40A2C0] mb-3.5">{title}</h2>
      <div className="[&_p]:text-[14px] [&_p]:leading-[1.7] [&_p]:text-[#6B7580] [&_p]:mb-3
                      [&_ul]:pl-5 [&_ul]:mb-4 [&_li]:text-[14px] [&_li]:leading-[1.7] [&_li]:text-[#6B7580] [&_li]:mb-1.5
                      [&_strong]:text-[#202C34] [&_strong]:font-semibold">
        {children}
      </div>
    </div>
  );
}
