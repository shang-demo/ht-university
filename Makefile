build:
	npm run build
	cp package.json dist/
	cd dist/; \
	git init; \
	git remote add origin git@github.com:shang-demo/ht-university.git; \
	git add -A; \
	git commit -m "foce"; \
	git push origin master -f