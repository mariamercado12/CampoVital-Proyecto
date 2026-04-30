/**
 * ClimaService — Conecta con Open-Meteo (gratuito, sin API Key)
 *
 * API: https://open-meteo.com/
 * Cómo funciona:
 *   - Recibe latitud y longitud de una ubicación
 *   - Devuelve temperatura, lluvia, humedad, viento cada hora
 *   - Se actualiza cada hora en sus servidores (datos de modelos meteorológicos globales)
 *   - NO requiere registro ni clave API
 *   - Cubrimiento global incluyendo el Magdalena, Colombia
 *
 * En CampoVital usamos las coordenadas del centro del Magdalena (Santa Marta)
 * y las actualizamos en cache cada 8 horas para no saturar la API.
 */

const CACHE_KEY = 'campovital_clima_cache';
const CACHE_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

// Coordenadas del Magdalena, Colombia
const MAGDALENA_LAT = 10.4236;
const MAGDALENA_LON = -74.4043;

const OPEN_METEO_URL =
  `https://api.open-meteo.com/v1/forecast?` +
  `latitude=${MAGDALENA_LAT}&longitude=${MAGDALENA_LON}` +
  `&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,windspeed_10m,weathercode` +
  `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max` +
  `&timezone=America%2FBogota` +
  `&forecast_days=4`;

/**
 * Códigos WMO → descripción legible
 */
export const WEATHER_CODES = {
  0: 'Cielo despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado',
  3: 'Nublado', 45: 'Niebla', 48: 'Niebla helada',
  51: 'Llovizna ligera', 53: 'Llovizna moderada', 55: 'Llovizna intensa',
  61: 'Lluvia ligera', 63: 'Lluvia moderada', 65: 'Lluvia intensa',
  71: 'Nieve ligera', 73: 'Nieve moderada', 75: 'Nieve intensa',
  80: 'Chubascos ligeros', 81: 'Chubascos moderados', 82: 'Chubascos violentos',
  95: 'Tormenta eléctrica', 96: 'Tormenta con granizo', 99: 'Tormenta severa con granizo',
};

export const WEATHER_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '⛈️',
  80: '🌦️', 81: '🌧️', 82: '⛈️', 95: '⛈️', 96: '⛈️', 99: '🌪️',
};

/**
 * Obtiene datos del clima. Usa cache de 8h para evitar llamadas excesivas.
 */
export async function getClima() {
  // Revisar cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL_MS) {
        return data;
      }
    }
  } catch {}

  // Llamar a Open-Meteo
  const res = await fetch(OPEN_METEO_URL);
  if (!res.ok) throw new Error('No se pudo obtener datos del clima');
  const data = await res.json();

  // Guardar en cache
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch {}

  return data;
}

/**
 * Devuelve los datos del clima para hoy (primer día del forecast)
 */
export function getHoyClima(clima) {
  if (!clima?.daily) return null;
  return {
    tempMax: clima.daily.temperature_2m_max[0],
    tempMin: clima.daily.temperature_2m_min[0],
    lluviaMm: clima.daily.precipitation_sum[0],
    probLluvia: clima.daily.precipitation_probability_max[0],
    vientoMax: clima.daily.windspeed_10m_max[0],
    fecha: clima.daily.time[0],
  };
}

/**
 * Genera alertas agrícolas a partir de los datos del clima del día
 */
export function generarAlertasClimaticas(hoy) {
  if (!hoy) return [];
  const alertas = [];

  if (hoy.probLluvia >= 70) {
    alertas.push({
      tipo: 'INUNDACION', icono: '🌧️',
      titulo: `Alta probabilidad de lluvia (${hoy.probLluvia}%)`,
      descripcion: `Se esperan lluvias con ${hoy.lluviaMm?.toFixed(1)} mm. No active el sistema de riego hoy. Si hay cultivos recién sembrados, asegúrese de que el suelo tenga buen drenaje.`,
      nivel: 'warning',
    });
  }

  if (hoy.tempMax >= 35) {
    alertas.push({
      tipo: 'ONDA_DE_CALOR', icono: '🔥',
      titulo: `Temperatura extrema: ${hoy.tempMax}°C`,
      descripcion: `El calor excesivo puede quemar el follaje. Evite cosechar entre 10am y 3pm. Riegue en la mañana temprano (antes de las 7am) o en la tarde después de las 5pm.`,
      nivel: 'danger',
    });
  }

  if (hoy.vientoMax >= 40) {
    alertas.push({
      tipo: 'VIENTO', icono: '💨',
      titulo: `Vientos fuertes: ${hoy.vientoMax} km/h`,
      descripcion: `Asegure las mallas de sombrío y tutores de plantas altas como el banano. No aplique agroquímicos hoy, el viento los dispersa y puede contaminar otros cultivos.`,
      nivel: 'warning',
    });
  }

  if (hoy.lluviaMm === 0 && hoy.probLluvia < 20 && hoy.tempMax >= 30) {
    alertas.push({
      tipo: 'SEQUIA', icono: '☀️',
      titulo: `Día seco y caluroso`,
      descripcion: `Sin lluvias previstas y temperatura alta de ${hoy.tempMax}°C. Priorice el riego de cultivos jóvenes y los que están en etapa de floración o fructificación.`,
      nivel: 'info',
    });
  }

  return alertas;
}

/**
 * Genera recomendaciones agrícolas personalizadas según el clima
 */
export function generarRecomendacionesClima(hoy, cultivos = []) {
  if (!hoy) return [];
  const recom = [];
  const lluvioAyer = hoy.lluviaMm > 5;

  // Riego
  if (hoy.probLluvia >= 60) {
    recom.push({
      icono: '💧', categoria: 'Riego',
      titulo: 'No es necesario regar hoy',
      descripcion: `La probabilidad de lluvia es del ${hoy.probLluvia}%. Ahorre agua y no active los sistemas de riego. Si llueve más de ${hoy.lluviaMm?.toFixed(0)} mm, el suelo tendrá suficiente humedad para 1-2 días.`,
    });
  } else if (hoy.tempMax >= 33) {
    recom.push({
      icono: '💧', categoria: 'Riego',
      titulo: 'Riegue temprano en la mañana',
      descripcion: `Con ${hoy.tempMax}°C de temperatura máxima, riegue antes de las 7am. Regar al mediodía con este calor evapora el agua rápidamente y puede quemar las hojas por efecto lupa.`,
    });
  }

  // Suelo post-lluvia
  if (lluvioAyer) {
    recom.push({
      icono: '🌱', categoria: 'Suelo',
      titulo: 'Cuidado con el suelo húmedo',
      descripcion: `Después de las lluvias, el suelo está saturado. Evite entrar con maquinaria pesada porque compacta la tierra. Para cultivos como el banano o la yuca, esto puede causar pudrición de raíces.`,
    });
    recom.push({
      icono: '🌿', categoria: 'Enfermedades',
      titulo: 'Riesgo de hongos post-lluvia',
      descripcion: `La humedad alta después de lluvias favorece enfermedades como el Moko en banano o la Pudrición Negra en cacao. Revise las plantas 24-48h después de la lluvia para detectar manchas o pudrición temprana.`,
    });
  }

  // Cosecha
  if (hoy.probLluvia >= 50) {
    recom.push({
      icono: '🌾', categoria: 'Cosecha',
      titulo: 'No coseche con lluvia',
      descripcion: `Evite cosechar frutas o granos con lluvia o suelo mojado. La humedad accelera la descomposición post-cosecha. Si debe cosechar, hágalo en las primeras horas de la mañana antes de que empiece la lluvia.`,
    });
  } else if (hoy.tempMax >= 35) {
    recom.push({
      icono: '🌾', categoria: 'Cosecha',
      titulo: 'Mejor hora para cosechar: madrugada',
      descripcion: `Con temperaturas de ${hoy.tempMax}°C, coseche entre 5am y 9am. Las frutas cosechadas con el calor del día tienen menor vida útil y pierden calidad más rápido.`,
    });
  }

  // Agroquímicos
  if (hoy.vientoMax >= 20 || hoy.probLluvia >= 50) {
    recom.push({
      icono: '🧪', categoria: 'Agroquímicos',
      titulo: 'Posponga aplicación de agroquímicos',
      descripcion: `${hoy.vientoMax >= 20 ? `Vientos de ${hoy.vientoMax} km/h` : `Lluvia esperada`} afectarán la efectividad de fungicidas, herbicidas e insecticidas. Aplíquelos cuando el clima sea estable, sin viento y sin lluvia en las próximas 4 horas.`,
    });
  }

  // Temperatura extrema para cultivos específicos
  const cultivosSensibles = cultivos.filter(c =>
    ['Cacao', 'Mango', 'Papaya'].some(n => c.nombre?.toLowerCase().includes(n.toLowerCase()))
  );
  if (cultivosSensibles.length > 0 && hoy.tempMax >= 36) {
    recom.push({
      icono: '🍫', categoria: 'Cultivos sensibles',
      titulo: `Proteja ${cultivosSensibles.map(c => c.nombre).join(', ')} del calor`,
      descripcion: `Temperaturas sobre 36°C pueden causar caída de flores en el cacao y mango. Si tiene sombrío disponible, úselo en las horas pico (11am–3pm).`,
    });
  }

  return recom;
}
