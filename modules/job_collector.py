from playwright.sync_api import sync_playwright
import time
import random
from pathlib import Path
from datetime import datetime
import json

class PersistentJobCollector:
    """
    Collecteur avec profil persistant et gestion de session.
    Approche : stabilité > vitesse
    """
    
    def __init__(self):
        self.output_file = Path("data/job_urls.txt")
        self.profile_dir = Path("data/browser_profile")  # Profil persistant
        self.cookies_file = Path("data/cookies.json")
        
        # Créer les dossiers
        self.output_file.parent.mkdir(exist_ok=True)
        self.profile_dir.mkdir(exist_ok=True)
    
    def human_delay(self, min_sec=2, max_sec=5):
        """Pause aléatoire humaine"""
        delay = random.uniform(min_sec, max_sec)
        print(f"   ⏳ Pause {delay:.1f}s...")
        time.sleep(delay)
    
    def random_mouse_movement(self, page):
        """Mouvements de souris aléatoires (très humain)"""
        for _ in range(random.randint(2, 5)):
            x = random.randint(100, 1500)
            y = random.randint(100, 900)
            steps = random.randint(20, 50)
            page.mouse.move(x, y, steps=steps)
            time.sleep(random.uniform(0.1, 0.3))
    
    def random_scroll(self, page):
        """Scroll aléatoire"""
        scroll_amount = random.randint(200, 600)
        page.mouse.wheel(0, scroll_amount)
        self.human_delay(1, 2)
    
    def save_cookies(self, context):
        """Sauvegarde les cookies de session"""
        try:
            cookies = context.cookies()
            with open(self.cookies_file, 'w', encoding='utf-8') as f:
                json.dump(cookies, f, indent=2)
            print(f"   💾 {len(cookies)} cookies sauvegardés")
        except Exception as e:
            print(f"   ⚠️  Erreur sauvegarde cookies : {e}")
    
    def load_cookies(self, context):
        """Charge les cookies sauvegardés"""
        if not self.cookies_file.exists():
            print("   ℹ️  Aucun cookie sauvegardé")
            return False
        
        try:
            with open(self.cookies_file, 'r', encoding='utf-8') as f:
                cookies = json.load(f)
            
            context.add_cookies(cookies)
            print(f"   ✅ {len(cookies)} cookies chargés")
            return True
        except Exception as e:
            print(f"   ⚠️  Erreur chargement cookies : {e}")
            return False
    
    def create_persistent_browser(self, playwright):
        """
        Crée un navigateur avec profil persistant.
        ÉTAPE 1 + ÉTAPE 2 : Stabilité maximale
        """
        print("🌐 Création du navigateur persistant...")
        
        # Lancement avec profil persistant
        browser = playwright.chromium.launch_persistent_context(
            user_data_dir=str(self.profile_dir),
            headless=False,
            slow_mo=500,  # Ralentit TOUT
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
            ],
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='fr-FR',
            timezone_id='Europe/Paris',
            geolocation={'latitude': 48.8566, 'longitude': 2.3522},
            permissions=['geolocation'],
        )
        
        # Script anti-détection
        browser.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
            
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
            
            window.navigator.chrome = {
                runtime: {}
            };
        """)
        
        print("   ✅ Profil persistant chargé")
        return browser
    
    def manual_cloudflare_bypass(self, page, site_name):
        """
        ÉTAPE 1 : Laisse l'utilisateur passer Cloudflare manuellement.
        Détecte automatiquement quand c'est passé.
        """
        print(f"🛡️  Vérification Cloudflare pour {site_name}...")
        
        print("\n" + "=" * 60)
        print("⚠️  SI CLOUDFLARE APPARAÎT :")
        print("   1. Résous le challenge dans le navigateur")
        print("   2. Attends que la page charge complètement")
        print("   3. Le script détectera automatiquement la fin")
        print("=" * 60 + "\n")
        
        max_wait = 60
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            try:
                # Détecte si Cloudflare est présent
                cloudflare_present = (
                    page.locator('text=Vérification').count() > 0 or
                    page.locator('text=Checking').count() > 0 or
                    page.locator('text=Just a moment').count() > 0 or
                    page.locator('#challenge-running').count() > 0
                )
                
                if cloudflare_present:
                    print(f"   ⏳ Challenge Cloudflare détecté... ({int(time.time() - start_time)}s)")
                    time.sleep(2)
                    continue
                
                # Vérifie si la page est chargée (présence d'inputs)
                if page.locator('input, button, a').count() > 5:
                    print("   ✅ Page chargée avec succès !")
                    return True
                
                time.sleep(1)
                
            except Exception as e:
                time.sleep(1)
        
        print("   ⚠️  Timeout - vérification manuelle requise")
        input("   Appuie sur ENTRÉE quand la page est chargée...")
        return True
    
    def collect_indeed_persistent(self, search_query="alternance développeur IA", location="France", max_results=10):
        """
        ÉTAPE 1-3 : Collecte Indeed avec session persistante.
        """
        print("=" * 60)
        print("🔍 INDEED - Collecte avec profil persistant")
        print("=" * 60)
        
        urls = []
        
        with sync_playwright() as p:
            browser = self.create_persistent_browser(p)
            page = browser.pages[0] if browser.pages else browser.new_page()
            
            try:
                # ÉTAPE 1 : Accès avec gestion Cloudflare
                print("\n📍 Navigation vers Indeed...")
                page.goto("https://fr.indeed.com", wait_until="domcontentloaded", timeout=60000)
                
                # Attend/résout Cloudflare
                self.manual_cloudflare_bypass(page, "Indeed")
                
                # ÉTAPE 2 : Sauvegarde cookies après succès
                self.save_cookies(browser)
                
                # Comportement humain
                self.human_delay(2, 4)
                self.random_mouse_movement(page)
                self.random_scroll(page)
                
                # Accepte cookies du site
                try:
                    page.click('button:has-text("Accepter")', timeout=3000)
                    self.human_delay(1, 2)
                except:
                    pass
                
                # ÉTAPE 3 : Extraction minimale
                print("\n🔍 Recherche d'offres...")
                
                # Remplissage formulaire (lent et humain)
                print(f"   📝 Quoi : {search_query}")
                page.click('input[name="q"]')
                self.human_delay(0.5, 1)
                for char in search_query:
                    page.keyboard.type(char)
                    time.sleep(random.uniform(0.05, 0.15))
                
                self.random_mouse_movement(page)
                
                print(f"   📍 Où : {location}")
                page.click('input[name="l"]')
                self.human_delay(0.5, 1)
                page.keyboard.press('Control+A')
                page.keyboard.press('Backspace')
                for char in location:
                    page.keyboard.type(char)
                    time.sleep(random.uniform(0.05, 0.15))
                
                self.human_delay(1, 2)
                self.random_mouse_movement(page)
                
                print("   🚀 Envoi recherche...")
                page.click('button[type="submit"]')
                page.wait_for_load_state("networkidle", timeout=30000)
                
                self.human_delay(3, 5)
                self.random_scroll(page)
                
                # Extraction (1 page uniquement - ÉTAPE 3)
                print("\n📋 Extraction des offres (page 1 uniquement)...")
                
                job_cards = page.locator('div[data-jk]').all()[:max_results]
                
                for i, card in enumerate(job_cards):
                    try:
                        job_id = card.get_attribute('data-jk')
                        
                        if job_id:
                            job_url = f"https://fr.indeed.com/viewjob?jk={job_id}"
                            
                            # Filtre alternance
                            card_text = card.inner_text().lower()
                            if any(kw in card_text for kw in ['alternance', 'apprentissage', 'contrat pro']):
                                urls.append(job_url)
                                print(f"   ✅ [{len(urls)}] Offre alternance trouvée")
                            else:
                                print(f"   ⏭️  [{i+1}] Ignoré (pas alternance)")
                        
                        # Pause entre extractions
                        self.human_delay(0.5, 1.5)
                        
                    except Exception as e:
                        print(f"   ⚠️  Erreur carte {i+1}")
                        continue
                
                print(f"\n✅ {len(urls)} offres Indeed collectées")
                
            except Exception as e:
                print(f"\n❌ Erreur : {e}")
            
            finally:
                # Comportement humain avant fermeture
                print("\n🏁 Fermeture propre...")
                self.human_delay(2, 4)
                browser.close()
        
        return urls
    
    def save_urls(self, urls, source=""):
        """Sauvegarde URLs sans doublons"""
        if not self.output_file.exists():
            self.output_file.touch()
        
        # Charge existantes
        existing = set()
        with open(self.output_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip() and line.startswith('http'):
                    existing.add(line.split('#')[0].strip())
        
        # Filtre nouvelles
        new_urls = [url for url in urls if url not in existing]
        
        if new_urls:
            with open(self.output_file, 'a', encoding='utf-8') as f:
                for url in new_urls:
                    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
                    f.write(f"{url} # {source} - {timestamp}\n")
            print(f"💾 {len(new_urls)} nouvelles URLs sauvegardées")
        else:
            print("ℹ️  Aucune nouvelle URL")
        
        return len(new_urls)


# Test
if __name__ == "__main__":
    print("=" * 60)
    print("🚀 COLLECTEUR AVEC PROFIL PERSISTANT")
    print("=" * 60)
    print("\n📌 Avantages :")
    print("   - Profil navigateur sauvegardé")
    print("   - Cookies réutilisés")
    print("   - Moins de challenges Cloudflare")
    print("\n⚠️  Le navigateur restera ouvert")
    print("⚠️  Résous manuellement les CAPTCHAs si nécessaire")
    print("\n" + "=" * 60)
    
    input("\n▶️  Appuie sur ENTRÉE pour démarrer...\n")
    
    collector = PersistentJobCollector()
    
    urls = collector.collect_indeed_persistent(
        search_query="alternance développeur IA",
        location="France",
        max_results=10
    )
    
    collector.save_urls(urls, source="Indeed-Persistent")
    
    print("\n" + "=" * 60)
    print(f"✅ TERMINÉ - {len(urls)} offres collectées")
    print(f"📁 Profil sauvegardé dans : {collector.profile_dir}")
    print(f"🍪 Cookies sauvegardés dans : {collector.cookies_file}")
    print("=" * 60)