import os

folder = r"c:\Users\HP\Documents\PROYECTO ARQUITECTURA\backend\agro-service\src\main\java\com\agrosmart\magdalena\domain\entity"
for root, dirs, files in os.walk(folder):
    for file in files:
        if file.endswith(".java"):
            path = os.path.join(root, file)
            with open(path, "rb") as f:
                content = f.read()
            if content.startswith(b'\xef\xbb\xbf'):
                with open(path, "wb") as f:
                    f.write(content[3:])
