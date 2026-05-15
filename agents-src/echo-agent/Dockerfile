FROM python:3.12-slim

RUN useradd -u 1000 -m runner
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ai_provider.py .
COPY main.py .

USER 1000:1000
ENV PYTHONUNBUFFERED=1

CMD ["python", "main.py"]
