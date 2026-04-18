FROM python:3.11-slim

WORKDIR /app

COPY competitor-monitor/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ai_provider.py ./ai_provider.py
COPY competitor-monitor/main.py ./main.py
COPY competitor-monitor/entrypoint.sh ./entrypoint.sh

RUN chmod +x entrypoint.sh \
    && useradd -m -u 1000 agent \
    && chown -R agent:agent /app

USER agent

ENTRYPOINT ["./entrypoint.sh"]
CMD ["python", "main.py"]
