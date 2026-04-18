FROM python:3.11-slim

WORKDIR /app

COPY content-writer/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ai_provider.py ./ai_provider.py
COPY content-writer/main.py ./main.py
COPY content-writer/entrypoint.sh ./entrypoint.sh

RUN chmod +x entrypoint.sh \
    && useradd -m -u 1000 agent \
    && chown -R agent:agent /app

USER agent

ENTRYPOINT ["./entrypoint.sh"]
CMD ["python", "main.py"]
