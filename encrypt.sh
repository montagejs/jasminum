< activate.sh cut -d' ' -f2 | while read EXPRESSION; do
    echo $EXPRESSION
    travis encrypt --add env.global $EXPRESSION
done
