# FootFusion ETL

Scripts en Python que obtienen los datos de las competiciones (Highlightly y football-data.org) y los guardan en MongoDB para el backend de FootFusion.

## Requisitos

- Python 3.14
- Una base de datos MongoDB
- Claves de API de [Highlightly](https://highlightly.net) y [football-data.org](https://www.football-data.org)

## Instalación

Todos los comandos se ejecutan desde la carpeta `etl`.

1. Crear el entorno virtual:

   ```bash
   python -m venv venv
   ```

2. Instalar las dependencias:

   ```bash
   # Windows
   venv\Scripts\python -m pip install --only-binary :all: --require-hashes -r requirements.txt
   # Linux / macOS
   venv/bin/python -m pip install --only-binary :all: --require-hashes -r requirements.txt
   ```

   - `--require-hashes` instala exactamente las versiones de `requirements.txt` y comprueba que cada paquete coincide con su hash; si alguno no coincide, la instalación falla.
   - `--only-binary :all:` instala solo paquetes precompilados, así ningún paquete ejecuta código propio al instalarse.

3. Copiar `.env.example` como `.env` y completar los valores. El fichero `.env` no se sube al repositorio.

## Dependencias

| Fichero | Contenido | ¿Se edita a mano? |
|---|---|---|
| `requirements.in` | Dependencias directas de la ETL | Sí |
| `requirements.txt` | Todas las dependencias (directas e indirectas) con su versión exacta y sus hashes | No, se genera |

Los dos ficheros se suben al repositorio: `requirements.txt` es el que garantiza que todos los entornos (incluido el CI) instalan las mismas versiones verificadas.

Para añadir, quitar o actualizar una dependencia:

1. Editar `requirements.in`.
2. Instalar pip-tools en el entorno virtual (solo hace falta una vez):

   ```bash
   venv\Scripts\python -m pip install pip-tools
   ```

3. Regenerar `requirements.txt`:

   ```bash
   venv\Scripts\pip-compile --generate-hashes --strip-extras --no-emit-index-url -o requirements.txt requirements.in
   ```

4. Volver a instalar con el comando del paso 2 de la instalación y ejecutar las pruebas.

## Pruebas

```bash
venv\Scripts\python -m pytest
```

Las pruebas no hacen peticiones a las APIs ni acceden a MongoDB. Se ejecutan también en GitHub Actions en cada push a una rama distinta de `main` y en cada pull request hacia `main`.

## Ejecución

Los scripts se ejecutan como módulos desde la carpeta `etl`, por ejemplo:

```bash
venv\Scripts\python -m scripts.sync_matchday
```

| Script | Función |
|---|---|
| `cache_fixtures` | Guarda en caché el calendario de partidos de cada competición |
| `load_initial_data` | Carga inicial de competiciones, equipos y jugadores |
| `normalize_positions` | Asigna a cada jugador su grupo de posición (POR, DEF, MED, DEL) |
| `sync_standings` | Clasificaciones por jornada y clasificación final de la temporada anterior (solo football-data) |
| `sync_matchday` | Estadísticas y eventos de los partidos jugados; se ejecuta a diario |

Las respuestas de las APIs se guardan en la carpeta `cache` (no se sube al repositorio) para no repetir peticiones. El plan gratuito de Highlightly permite 100 peticiones al día; la ETL se detiene al llegar a `HIGHLIGHTLY_DAILY_LIMIT` (90 por defecto).
