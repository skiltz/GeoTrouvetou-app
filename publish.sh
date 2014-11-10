tag=$( git describe --tags )
branch=$( git rev-parse --abbrev-ref HEAD )
echo $branch
echo $tag
cd GeoTrouvetou
git checkout -b $branch
git reset --hard
cd ..
grunt build
grunt compile
cd GeoTrouvetou
git add --all ./
git commit -m $tag
git tag $tag
git checkout with_jre_7
git merge $branch -m "${tag}_jre"
git tag "${tag}_jre"
git push --all
git push --tags

