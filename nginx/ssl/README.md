# SSL Certificates

This directory should contain your SSL certificates for HTTPS.

For production, you should use real certificates from a certificate authority like Let's Encrypt.

## Creating Self-signed Certificates for Development

To create self-signed certificates for development:

```bash
# Generate a private key
openssl genrsa -out key.pem 2048

# Generate a certificate signing request
openssl req -new -key key.pem -out csr.pem

# Generate a self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem

# Remove the certificate signing request (no longer needed)
rm csr.pem
```

## Using Let's Encrypt for Production

For production environments, use Let's Encrypt to obtain free, trusted certificates:

1. Install certbot: `apt-get install certbot python3-certbot-nginx`
2. Obtain and install certificates: `certbot --nginx -d yourdomain.com -d www.yourdomain.com`
3. Certificates will be automatically renewed

## Required Files

- `cert.pem`: The SSL certificate
- `key.pem`: The private key for the certificate

These files are referenced in the Nginx configuration.