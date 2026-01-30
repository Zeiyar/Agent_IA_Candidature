# Agent_IA_Candidature
Le but est qu'il puisse me répertorier chaque offre remplir les inputs a ma place me faire une lettre de motivation cibler et que je n'ai qu'a appuyer sur postuler (en développement)


job-application-agent/
│
├── main.py                    # Point d'entrée principal
│
├── config/
│   ├── settings.py           # Configuration générale
│   └── sources.json          # Liste des sources d'offres autorisées
│
├── modules/
│   ├── job_collector.py      # NOUVEAU : Collecte passive d'URLs
│   ├── cv_parser.py          # Extraction du CV PDF
│   ├── job_analyzer.py       # Analyse de l'offre avec LLM
│   ├── letter_generator.py   # Génération de la lettre de motivation
│   └── browser_agent.py      # Automatisation Playwright
│
├── data/
│   ├── cv.pdf                # Ton CV
│   └── job_urls.txt          # URLs candidates collectées
│
├── output/
│   └── logs.txt              # Logs des candidatures
│
├── requirements.txt          # Dépendances Python
│
└── README.md                 # Documentation du projet
