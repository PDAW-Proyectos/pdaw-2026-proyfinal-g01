import os
import json

def inicializar_datatest():
    print("Verificando la estructura para la base de datos de prueba (datatest)...")
    
    # Obtenemos la ruta raíz del proyecto (subiendo dos niveles desde tests/testBruno)
    ruta_actual = os.path.dirname(os.path.abspath(__file__))
    raiz_proyecto = os.path.abspath(os.path.join(ruta_actual, "..", ".."))
    
    # Definimos la ruta de la carpeta datatest en la raíz
    carpeta = os.path.join(raiz_proyecto, "datatest")
    
    # Crear la carpeta datatest si no existe
    if not os.path.exists(carpeta):
        os.makedirs(carpeta)
        print(f"Carpeta '{carpeta}' creada correctamente en la raíz.")
    else:
        print(f"La carpeta '{carpeta}' ya existe.")
        
    # Archivos JSON a inicializar
    archivos = ["usuarios.json", "mazos.json", "cartas.json"]
    
    for archivo in archivos:
        ruta_archivo = os.path.join(carpeta, archivo)
        # Si el archivo no existe o está vacío, lo inicializamos con una lista vacía []
        if not os.path.exists(ruta_archivo) or os.path.getsize(ruta_archivo) == 0:
            with open(ruta_archivo, "w", encoding="utf-8") as f:
                json.dump([], f, indent=4)
            print(f"Archivo {archivo} inicializado.")
        else:
            print(f"El archivo {archivo} ya existe y contiene datos.")

    print("\n¡Proceso finalizado con éxito! Ya podés arrancar tu servidor.")

if __name__ == "__main__":
    inicializar_datatest()