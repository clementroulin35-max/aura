Problématique : "J'en ai marre de rien comprendre au versionning git et à la gestion des push pull fetch rebase checkpoint branch et mes sources local. Je veux que tu m'explique le flux des commandes au travers d'un shéma avec les commandes adéquates. J'ai créer un projet en collaboration avec un Agent IA. Il y a une branche flash pour le développement, une branche high pour le developpement aussi mais avec un modele LLM plus robuste. Et la branche main. Mon principe c'est de dev en local et push sur la branche flash . Si mon environnement de travail bascule avec un modele plus élevé, on switch de branche pour high, ca veut dire qu'on récupère normalement le travail de la branche flash la plus récente pour reprendre les dev (si le modele flash a fait des erreurs). Ainsi on push sur la branche high seulement le résultat "corrigé" des dev de flash. Et si je considère que la version est stable et propre, depuis la branche high on peut push sur main (qui scelle une version). Quand je retourne sur la branche flash pour de nouveau développement. Je récupère la dernière version de main. (Attention je ne veux pas écraser à chaque fois mes sources local, en théorie au moment du push sur main, je devrais rebasculer sur flash pour rééquilibré tout de suite les différences de version). Donc est-ce utile de faire un rebase ? (En cas de trop grand écart de développement). Que se passe-t-il si les "mécanismes" et procédure ne sont pas suivi à la lettre, comment je fais en manuel pour push la flash sur la high et sur la main en cas de soucis ? Comment éviter de perdre mes developpements local si jamais je rebase avec une vieille version main parce que j'ai oublié de push d'abord sur la high ?"

On respire un grand coup. C'est tout à fait normal de s'arracher les cheveux sur Git au début : c'est un outil puissant, mais sa logique peut sembler être celle d'un savant fou.

Ton workflow est en fait assez structuré et logique. On va le mettre à plat pour que tu ne te sentes plus comme un passager clandestin dans ton propre projet.

1. Comprendre le flux des zones
Avant de parler des branches, il faut comprendre où se trouve ton code. Git fonctionne sur 4 zones :

Working Directory : Tes fichiers sur ton ordi (ce que tu tapes).

Staging Area (Index) : La salle d'attente avant la photo (quand tu fais git add).

Local Repo : Ta base de données locale (quand tu fais git commit).

Remote Repo : Le serveur distant, GitHub/GitLab (quand tu fais git push).

2. Ton Workflow : La boucle "Flash -> High -> Main"
Voici les commandes exactes pour ton cycle de développement :

Étape A : Le bac à sable (flash)
Tu codes en local et tu envoies tes idées.

Bash
git checkout flash           # Tu te mets sur flash
# ... Tu codes ...
git add .                    # Tu prépares tes changements
git commit -m "Dev rapide"   # Tu valides en local
git push origin flash        # Tu envoies sur le serveur
Étape B : La montée en gamme (high)
Le modèle Flash a galéré, tu passes sur un LLM plus costaud. Tu veux récupérer le travail de flash dans high.

Bash
git checkout high            # Tu passes sur la branche robuste
git merge flash              # Tu ramènes le travail de flash dans high
# ... Tu corriges les erreurs avec le gros modèle ...
git add .
git commit -m "Correction via modèle High"
git push origin high         # Tu sauvegardes le propre
Étape C : La mise en production (main)
C'est stable, on scelle la version.

Bash
git checkout main            # Tu vas sur la branche sacrée
git merge high               # Tu ramènes le résultat corrigé
git push origin main         # C'est officiellement la version stable
3. Le Rebase : Utile ou pas ?
Oui, c'est très utile pour toi.
Le but du rebase est de "réaligner" ta branche de départ sur la version la plus récente de main sans créer un nœud de fusion (merge commit) illisible.

Quand le faire ?
Juste après avoir poussé sur main. Ta branche flash est maintenant "en retard" par rapport à main.

Bash
git checkout flash
git rebase main
Cela va "débrancher" ton historique flash et le "recoller" au bout du dernier commit de main. C'est propre, c'est linéaire.

Attention : On ne fait un rebase que sur du travail local ou des branches de dev dont tu es le seul maître. Ne rebase jamais main !

4. Tes questions de "secours"
"Comment je fais en manuel si les procédures échouent ?"
Si tu as fait n'importe quoi sur les branches et que tu veux juste que high devienne exactement comme flash (en écrasant tout), tu peux faire :

Bash
git checkout high
git reset --hard flash  # ATTENTION : ça supprime ce qu'il y avait sur high pour copier flash
Si tu veux juste fusionner flash dans high manuellement malgré des conflits :

git merge flash

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
Résumé de ton réflexe de survie :
Pour sauvegarder : add + commit + push.

Pour changer de branche proprement : git stash -> git checkout -> git stash pop.

Pour synchroniser flash avec le nouveau main : git checkout flash -> git rebase main.