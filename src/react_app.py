import os
import base64

def json_scandir():
	output = [{"name": entry.name, "isDirectory": entry.is_dir()} for entry in sorted(os.scandir(p), key=lambda entry:entry.is_dir())]
