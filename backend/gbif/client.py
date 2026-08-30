import httpx
from typing import List, Dict, Any, Optional

GBIF_OCCURRENCE_API = "https://api.gbif.org/v1/occurrence/search"

class GBIFClient:
    """
    Client for querying the GBIF (Global Biodiversity Information Facility) API.
    Used to fetch expected species occurrences for a site based on lat/lon coordinates.
    """

    async def get_expected_species(
        self, lat: float, lon: float, radius_km: float = 25.0, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Query GBIF occurrences within a bounding box around lat/lon.
        """
        delta = radius_km / 111.0  # approximate degrees per km
        min_lat, max_lat = lat - delta, lat + delta
        min_lon, max_lon = lon - delta, lon + delta

        geometry = f"POLYGON(({min_lon} {min_lat}, {max_lon} {min_lat}, {max_lon} {max_lat}, {min_lon} {max_lat}, {min_lon} {min_lat}))"

        params = {
            "geometry": geometry,
            "taxonKey": 212,  # Aves (Birds)
            "hasCoordinate": "true",
            "limit": limit
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(GBIF_OCCURRENCE_API, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get("results", [])
                    species_list = []
                    seen = set()

                    for rec in results:
                        sci_name = rec.get("species") or rec.get("scientificName")
                        vernacular = rec.get("vernacularName") or rec.get("species")
                        if sci_name and sci_name not in seen:
                            seen.add(sci_name)
                            species_list.append({
                                "scientific": sci_name,
                                "common": vernacular or sci_name,
                                "gbifKey": rec.get("speciesKey")
                            })
                    return species_list
        except Exception as e:
            print(f"GBIF API query warning: {e}")
            
        return []

gbif_client = GBIFClient()
