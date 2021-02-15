--------------------------------------------------------------------------------
--
-- Chameleon primitives.
--
-- This module ought to be implicitly imported into every other 
-- (including the Prelude.)
--
--------------------------------------------------------------------------------

module Primitive
where

--------------------------------------------------------------------------------
-- Overloaded == is necessary for matching pattern literals.

class Eq a where
    (==):: a -> a -> Bool
    x /= y = not (x == y)
    (/=) :: a -> a -> Bool
    x == y = not (x /= y)

infix 4 ==

data Ordering = LT | EQ | GT

class Eq a => Ord a where
  compare :: a -> a -> Ordering
  (<), (<=), (>), (>=) :: a -> a -> Bool
  max, min             :: a -> a -> a
  compare x y = if x == y then EQ
                  else if x <= y then LT
                  else GT
  x <  y = case compare x y of { LT -> True;  _ -> False }
  x <= y = case compare x y of { GT -> False; _ -> True }
  x >  y = case compare x y of { GT -> True;  _ -> False }
  x >= y = case compare x y of { LT -> False; _ -> True }
  max x y = if x <= y then y else x
  min x y = if x <= y then x else y

instance Eq Int where 
  (==) = undefined 
  x == y = not (x /= y)

instance Eq Integer where 
  (==) = undefined 
  x == y = not (x /= y)

instance Eq Float where 
  (==) = undefined 
  x == y = not (x /= y)

instance Eq Double where 
  (==) = undefined 

instance Eq Char where 
  (==) = undefined 
  x == y = not (x /= y)

instance Eq a => Eq [a] where
  x == y = True


primitive primEqInt	    :: Int -> Int -> Bool
primitive primEqInteger :: Integer -> Integer -> Bool
primitive primEqFloat   :: Float -> Float -> Bool
primitive primEqDouble  :: Double -> Double -> Bool
primitive primEqChar    :: Char -> Char -> Bool

----------------------------------------
-- Comparison functions.


primitive primGTInt	  :: Int -> Int -> Bool
primitive primGTInteger   :: Integer -> Integer -> Bool
primitive primGTFloat	  :: Float -> Float -> Bool
primitive primGTDouble    :: Double -> Double -> Bool

primitive primGTEqInt	  :: Int -> Int -> Bool
primitive primGTEqInteger :: Integer -> Integer -> Bool
primitive primGTEqFloat	  :: Float -> Float -> Bool
primitive primGTEqDouble  :: Double -> Double -> Bool

primitive primLTInt	  :: Int -> Int -> Bool
primitive primLTInteger	  :: Integer -> Integer -> Bool
primitive primLTFloat	  :: Float -> Float -> Bool
primitive primLTDouble    :: Double -> Double -> Bool

primitive primLTEqInt	  :: Int -> Int -> Bool
primitive primLTEqInteger :: Integer -> Integer -> Bool
primitive primLTEqFloat	  :: Float -> Float -> Bool
primitive primLTEqDouble  :: Double -> Double -> Bool

--------------------------------------------------------------------------------
-- Overloaded fromInteger and fromRational are required for pattern matching
-- against numeric literals.

-- class Num a where
--     fromInteger :: Integer -> a  

instance Num Int     where 
  fromInteger = undefined 
instance Num Integer where 
  fromInteger = undefined 

class Fractional a where
  fromRational :: Rational -> a


--------------------------------------------------------------------------------
-- Primitive numerical operations.

primitive primIntegerToInt :: Integer -> Int
primitive primIntegerToInteger :: Integer -> Integer


primitive primAddInt :: Int -> Int -> Int
primitive primSubInt :: Int -> Int -> Int
primitive primMulInt :: Int -> Int -> Int
primitive primDivInt :: Int -> Int -> Int


--------------------------------------------------------------------------------
-- The run-time error function.

primitive primError :: [Char] -> a

-- noSuchField, undefinedMethod, 
--    patternMatchFailed, uninitialisedField :: [Char] -> a
noSuchField	   = primError
undefinedMethod	   = primError
patternMatchFailed = primError
uninitialisedField = primError



class  (Eq a, Show a) => Num a  where
    (+), (-), (*)    :: a -> a -> a
    negate           :: a -> a
    abs, signum      :: a -> a
    fromInteger      :: Integer -> a


class  Show a  where
    showsPrec        :: Int -> a -> ShowS
    show             :: a -> String 
    showList         :: [a] -> ShowS

type  String   = [Char]
type  ShowS    = String -> String
--------------------------------------------------------------------------------
-- Functions the desugaring transformation implicitly depends upon.

id :: a -> a
id x = x

map :: (a -> b) -> [a] -> [b]
map f []     = []
map f (x:xs) = f x : map f xs

not :: Bool -> Bool
not b = if b then False else True

(&&) :: Bool -> Bool -> Bool
(&&) a b = if a then b else False

infixr 3 &&

----------------------------------------

-- succInt :: Int -> Int
-- succInt x = x `primAddInt` 1

ltInt, gtInt :: Int -> Int -> Bool
ltInt = primLTInt
gtInt = primGTInt

-- enumFromToInt :: Int -> Int -> [Int]
-- enumFromToInt x y = enum x 
--   where
--     enum x | x `primLTEqInt` y = x : enum (succInt x)
-- 	   | otherwise	       = []

-- enumFromThenToInt :: Int -> Int -> Int -> [Int]
-- enumFromThenToInt x y z = enum x
--   where
--     delta = y `primSubInt` x
--     cond  
--       | x `primLTInt` y = (`primGTInt` z)
--       | otherwise	    = (`primLTInt` z)

--     enum x 
--       | cond x    = []
--       | otherwise = x : enum (x `primAddInt` delta)


--------------------------------------------------------------------------------
-- Miscellaneous

otherwise :: Bool 
otherwise = True

data Rational

undefined :: a 
undefined = primError "undefined"

error = undefined

length :: [a] -> Integer
length []        =  0
length (_:l)     =  1 + length l

primitive primToUpper :: Char -> Char
toUpper = primToUpper

primitive primToLower :: Char -> Char
toLower = primToLower


(++) :: [a] -> [a] -> [a]
(++) = undefined 

filter::(a -> Bool) -> [a] -> [a]
filter = undefined

lines :: [Char] -> [[Char]]
lines = undefined

unlines :: [[Char]] -> [Char]
unlines = undefined 

class Semigroup a where
  (<>) :: a -> a -> a

instance Semigroup [a] where
  (<>) = undefined

instance (Semigroup a) => Semigroup (Maybe a) where
  (<>) = undefined

instance (Semigroup b) => Semigroup (a -> b) where
  (<>) = undefined

instance (Semigroup a, Semigroup b) => Semigroup (a, b) where
  (<>) = undefined

class Semigroup a => Monoid a where
  mempty :: a
  mappend = (<>)
  mconcat [] = mempty 
  mconcat (x:xs) = mappend x (mconcat xs)

instance Monoid [a] where
  mempty = []

instance (Monoid a, Monoid b) => Monoid (a, b) where
  mempty = undefined

instance (Monoid b) => Monoid (a -> b) where
  mempty = undefined

instance (Semigroup a) => Monoid (Maybe a) where
  mempty = Nothing
 
class Functor f where
  fmap :: (a -> b) -> f a -> f b
  (<$) a fb = fmap (const a) fb

instance Functor [] where
  fmap = undefined

instance Functor Maybe where
  fmap = undefined

instance Functor ((->) a) where
  fmap = undefined


class Functor f => Applicative f where
  pure :: a -> fa
  (<*>) :: f (a -> b) -> f a -> f b 

instance Applicative [] where
  pure = undefined
  (<*>) = undefined

instance Applicative Maybe where
  pure = undefined
  (<*>) = undefined

instance Applicative ((->) a) where
  pure = undefined
  (<*>) = undefined

class Applicative m => Monad m where
  (>>=) :: m a -> (a -> m b) -> m b
  (>>) :: m a -> m b -> m b
  return :: a -> m a

instance Monad [] where
  (>>=) = undefined

instance Monad Maybe where
  (>>=) = undefined

instance Monad ((->) a) where
  (>>=) = undefined

data IO a = IO a
instance Semigroup a => Semigroup (IO a) where
  (<>) = undefined

instance Monoid a => Monoid (IO a) where
  mempty = undefined

instance Functor IO where
  fmap = undefined

instance Applicative IO where
  (<*>) = undefined

instance Monad IO where
  (>>=) = undefined
  return = undefined
  (>>) = undefined

data Maybe a = Nothing | Just a

putStrLn :: [Char] -> IO ()
putStrLn = undefined

zip :: [a] -> [b] -> [(a, b)]
zip = undefined

readFile :: [Char] -> IO [Char]
readFile = undefined

mapM_ :: (Monad m) => (a -> m b) -> [a] -> m ()
mapM_ = undefined

enumFrom :: Enum a => a -> [a]
enumFrom = undefined

class Enum a where
  toEnum :: Int -> a
  fromEnum :: a -> Int
  succ a = toEnum (fromEnum a)
  pred a = toEnum (fromEnum a)
  enumFrom a = [a]
  enumFromThen a b = [a,b] 
  enumFromTo a b =  [a,b]  
  enumFromThenTo a b c = [a,b,c] 

instance Enum Integer where
  toEnum = undefined 
  fromEnum = undefined 

instance Enum Int where
  toEnum = undefined 
  fromEnum = undefined 

fst :: (a, b) -> a
fst (a, b) = a

snd :: (a, b) -> b
snd (a, b) = b