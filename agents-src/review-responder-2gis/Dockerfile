FROM python:3.11-slim

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/*

COPY review-responder-2gis/requirements.txt ./requirements.txt
COPY security-baseline.txt ./security-baseline.txt
RUN pip install --no-cache-dir wheel==0.46.3 \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir --upgrade -r security-baseline.txt

COPY ai_provider.py ./ai_provider.py
COPY review-responder-2gis/main.py ./main.py
COPY review-responder-2gis/entrypoint.sh ./entrypoint.sh

RUN chmod +x entrypoint.sh \
    && groupadd -g 1000 agent \
    && useradd -m -u 1000 -g 1000 agent \
    && mkdir -p /data/pending_reviews \
    && chown -R 1000:1000 /app /data

USER 1000:1000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["python", "main.py"]
