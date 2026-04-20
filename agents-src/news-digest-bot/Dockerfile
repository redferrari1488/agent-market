FROM python:3.11-slim

WORKDIR /app

COPY news-digest-bot/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ai_provider.py ./ai_provider.py
COPY news-digest-bot/main.py ./main.py
COPY news-digest-bot/entrypoint.sh ./entrypoint.sh

RUN chmod +x entrypoint.sh \
    && groupadd -g 1000 agent \
    && useradd -m -u 1000 -g 1000 agent \
    && chown -R 1000:1000 /app

USER 1000:1000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["python", "main.py"]
