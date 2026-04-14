Problématique : "J'en ai marre de rien comprendre au versionning git et à la gestion des push pull fetch rebase checkpoint branch et mes sources local. Je veux que tu m'explique le flux des commandes au travers d'un shéma avec les commandes adéquates. J'ai créer un projet en collaboration avec un Agent IA. Il y a une branche flash pour le développement, une branche high pour le developpement aussi mais avec un modele LLM plus robuste. Et la branche main. Mon principe c'est de dev en local et push sur la branche flash . Si mon environnement de travail bascule avec un modele plus élevé, on switch de branche pour high, ca veut dire qu'on récupère normalement le travail de la branche flash la plus récente pour reprendre les dev (si le modele flash a fait des erreurs). Ainsi on push sur la branche high seulement le résultat "corrigé" des dev de flash. Et si je considère que la version est stable et propre, depuis la branche high on peut push sur main (qui scelle une version). Quand je retourne sur la branche flash pour de nouveau développement. Je récupère la dernière version de main. (Attention je ne veux pas écraser à chaque fois mes sources local, en théorie au moment du push sur main, je devrais rebasculer sur flash pour rééquilibré tout de suite les différences de version). Donc est-ce utile de faire un rebase ? (En cas de trop grand écart de développement). Que se passe-t-il si les "mécanismes" et procédure ne sont pas suivi à la lettre, comment je fais en manuel pour push la flash sur la high et sur la main en cas de soucis ? Comment éviter de perdre mes developpements local si jamais je rebase avec une vieille version main parce que j'ai oublié de push d'abord sur la high ?"

On respire un grand coup. C'est tout à fait normal de s'arracher les cheveux sur Git au début : c'est un outil puissant, mais sa logique peut sembler être celle d'un savant fou.

Ton workflow est en fait assez structuré et logique. On va le mettre à plat pour que tu ne te sentes plus comme un passager clandestin dans ton propre projet.

1. Comprendre le flux des zones
Avant de parler des branches, il faut comprendre où se trouve ton code. Git fonctionne sur 4 zones :

Working Directory : Tes fichiers sur ton ordi (ce que tu tapes).

Staging Area (Index) : La salle d'attente avant la photo (quand tu fais git add).

Local Repo : Ta base de données locale (quand tu fais git commit).

Remote Repo : Le serveur distant, GitHub/GitLab (quand tu fais git push).

2. Ton Workflow : La boucle "FLASH -> High -> Main"
Voici les commandes automatisées pour ton cycle de développement :

Étape A : Le bac à sable (FLASH)
Tu codes en local et tu sauvegardes régulièrement.

Bash
make align-flash           # Aligne l'identité sur FLASH (Gemini)
make flash-sync            # Récupère le dernier main (au début de session)
# ... Tu codes ...
make checkpoint            # Sauvegarde rapide (add + commit + push)

Étape B : La montée en gamme (high)
Le modèle FLASH a galéré, tu passes sur un LLM plus costaud. Tu veux transférer le travail.

Bash
make align-high            # Aligne l'identité sur High (Claude/GPT4)
make handover              # Automatise : stash -> checkout high -> merge FLASH
# ... Tu corriges les erreurs avec le gros modèle ...
make build                 # Teste tout + commit + push sur origin/high

Étape C : La mise en production (main)
C'est stable, on scelle la version. Elle est poussée sur main AUTOMATIQUEMENT à la fin du `make build` si tu es en mode HIGH.

Étape D : Retour au développement
Tu veux repartir sur FLASH pour la suite.

Bash
make align-flash
make back-to-flash         # Automatise : checkout FLASH -> rebase main

3. Le Rebase : Utile ou pas ?
Oui, c'est très utile pour toi.
Le but du rebase est de "réaligner" ta branche de départ sur la version la plus récente de main sans créer un nœud de fusion (merge commit) illisible.

Quand le faire ?
Juste après avoir poussé sur main. Ta branche FLASH est maintenant "en retard" par rapport à main.

Bash
make back-to-flash
Cela va "débrancher" ton historique FLASH et le "recoller" au bout du dernier commit de main. C'est propre, c'est linéaire.

Attention : On ne fait un rebase que sur du travail local ou des branches de dev dont tu es le seul maître. Ne rebase jamais main !

4. Tes questions de "secours"
"Comment je fais en manuel si les procédures échouent ?"
Si tu as fait n'importe quoi sur les branches et que tu veux juste que high devienne exactement comme FLASH (en écrasant tout), tu peux faire :

Bash
git checkout high
git reset --hard FLASH  # ATTENTION : ça supprime ce qu'il y avait sur high pour copier FLASH
Si tu veux juste fusionner FLASH dans high manuellement malgré des conflits :

git merge FLASH

Git va te dire "CONFLIT". Ouvre tes fichiers, cherche les balises <<<< HEAD, choisis le code que tu veux garder.

git add . puis git commit.

"Comment éviter de perdre mes dev locaux si j'oublie de push ?"
C'est la peur classique. La règle d'or : Le git stash est ton meilleur ami.

Si tu veux changer de branche ou rebaser mais que tu as du code non terminé que tu ne veux pas perdre (et pas encore commit) :

git stash : Ça "met de côté" tes modifs actuelles dans une boîte temporaire. Ton répertoire devient propre.

Fais tes manip (git checkout, git pull, git rebase).

git stash pop : Ça ressort tes modifs et tente de les réappliquer sur ton nouvel état.

Pour ton cas spécifique (oublier de push sur high avant un rebase) :
Si tu lances un rebase et que ça se passe mal, Git te permet de revenir en arrière comme si rien ne s'était passé :

Bash
git rebase --abort

Résumé de tes nouveaux réflexes :
Pour sauvegarder : make checkpoint.

Pour voir où tu en es : make git-status.

Pour passer en revue (FLASH -> High) : make align-high -> make handover.

Pour finir proprement : make build.