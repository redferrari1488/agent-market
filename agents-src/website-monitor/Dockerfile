FROM ghcr.io/dgtlmoon/changedetection.io:latest

USER root

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends curl jq \
    && python -m pip install --no-cache-dir wheel==0.46.3 \
    && rm -rf /var/lib/apt/lists/*

# Принудительный upgrade уязвимых пакетов поверх changedetection.io upstream
# (urllib3 2.6.3 имел CRLF injection; upstream редко быстро бампает).
COPY security-baseline.txt /tmp/security-baseline.txt
RUN python -m pip install --no-cache-dir --upgrade -r /tmp/security-baseline.txt

COPY website-monitor/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["python", "changedetection.py", "-d", "/data", "-p", "5000"]
