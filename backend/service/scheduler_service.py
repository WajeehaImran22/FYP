#schedular service
import httpx
import logging
from datetime import datetime
from supabase import Client
from core.config import settings

logger = logging.getLogger("billboard_api.scheduler")

class SchedulerService:
    
    @staticmethod
    def get_current_time_category() -> str:
        """Categorizes the current hour into billboard-friendly segments."""
        hour = datetime.now().hour
        if 5 <= hour < 11: return "morning"
        if 11 <= hour < 17: return "afternoon"
        if 17 <= hour < 22: return "evening"
        return "night"

    @staticmethod
    async def get_current_weather(city: str = "Islamabad") -> str:
        """Fetches live weather and maps it to our DB categories."""
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={settings.OPENWEATHER_API_KEY}"
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                data = response.json()
                
                # OpenWeather common IDs: 2xx (Storm), 3xx (Drizzle), 5xx (Rain), 6xx (Snow), 800 (Clear)
                main_weather = data['weather'][0]['main'].lower()
                
                if "rain" in main_weather or "drizzle" in main_weather: return "rain"
                if "snow" in main_weather: return "snow"
                if "cloud" in main_weather: return "clouds"
                return "clear"
        except Exception as e:
            logger.error(f"Weather API failed: {e}")
            return "clear" # Fallback

    @staticmethod
    async def get_active_billboard_ad(user_client: Client):
        """Finds the best ad based on the current vibe."""
        time_cat = SchedulerService.get_current_time_category()
        weather_cat = await SchedulerService.get_current_weather()
        
        logger.info(f"Scheduling check: Time={time_cat}, Weather={weather_cat}")

        # Priority 1: Exact match for both Time and Weather
        res = user_client.table("ads").select("*")\
            .eq("time_of_day", time_cat)\
            .eq("weather_condition", weather_cat)\
            .order("created_at", desc=True).limit(1).execute()
        
        if res.data: return res.data[0]

        # Priority 2: Match Weather only (any time)
        res = user_client.table("ads").select("*")\
            .eq("weather_condition", weather_cat)\
            .eq("time_of_day", "any")\
            .order("created_at", desc=True).limit(1).execute()
            
        if res.data: return res.data[0]

        # Priority 3: Match Time only (any weather)
        res = user_client.table("ads").select("*")\
            .eq("time_of_day", time_cat)\
            .eq("weather_condition", "any")\
            .order("created_at", desc=True).limit(1).execute()

        if res.data: return res.data[0]

        # Fallback: Get the latest ad marked 'any/any'
        res = user_client.table("ads").select("*")\
            .eq("time_of_day", "any")\
            .eq("weather_condition", "any")\
            .order("created_at", desc=True).limit(1).execute()
            
        return res.data[0] if res.data else None
