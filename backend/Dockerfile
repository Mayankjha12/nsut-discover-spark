FROM python:3.12-slim
WORKDIR /app
COPY requirements-deploy.txt .
RUN pip install --no-cache-dir -r requirements-deploy.txt \
    && useradd --create-home app
COPY --chown=app:app --chmod=644 server.py schedules.py .
USER app
EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
