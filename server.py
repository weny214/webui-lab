import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# 繼承 StaticFiles 來限制只能讀取特定檔案類型
class HtmlCssOnlyStaticFiles(StaticFiles):
    def lookup_path(self, path: str):
        full_path, stat_result = super().lookup_path(path)
        if full_path:
            # 如果是資料夾（例如根目錄），直接放行讓 FastAPI 尋找 index.html
            if os.path.isdir(full_path):
                return full_path, stat_result
            
            ext = os.path.splitext(full_path)[1].lower()
            # 允許讀取 html, css, js, json, svg
            if ext not in ['.html', '.css', '.js', '.json', '.svg']:
                return "", None
        return full_path, stat_result

# 掛載當前目錄(".")為靜態網站，並啟用自動尋找 index.html
app.mount("/", HtmlCssOnlyStaticFiles(directory=".", html=True), name="static")