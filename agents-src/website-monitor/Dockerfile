FROM ghcr.io/dgtlmoon/changedetection.io:latest

USER root

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends curl jq \
    && python -m pip install --no-cache-dir \
        cryptography==46.0.7 \
        setuptools==82.0.1 \
        urllib3==2.6.3 \
        wheel==0.46.3 \
    && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["python", "changedetection.py", "-d", "/data", "-p", "5000"]
